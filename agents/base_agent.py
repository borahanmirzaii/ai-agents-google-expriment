"""
Base Agent Implementation

This module provides the foundational BaseAgent class that all agents inherit from.
It handles Vertex AI integration, tool management, and core agent functionality.
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum

import vertexai
from vertexai.generative_models import (
    GenerativeModel,
    GenerationConfig,
    Tool,
    FunctionDeclaration,
    Content,
    Part,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    """Status of agent execution"""
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class AgentConfig:
    """Configuration for an agent"""
    name: str
    model_name: str = "gemini-2.5-flash-preview-5-20"
    system_prompt: str = "You are a helpful AI agent."
    temperature: float = 0.7
    max_tokens: int = 8192
    top_p: float = 0.95
    top_k: int = 40
    timeout: int = 300
    project_id: Optional[str] = None
    location: str = "us-central1"


@dataclass
class AgentResponse:
    """Response from an agent"""
    agent_name: str
    content: str
    status: AgentStatus
    metadata: Dict[str, Any] = field(default_factory=dict)
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None


class BaseAgent(ABC):
    """
    Base class for all AI agents in the system.

    This class provides:
    - Integration with Vertex AI and Gemini models
    - Tool registration and management
    - Common agent functionality
    - Error handling and logging

    Subclasses should implement the process_task() method for custom logic.
    """

    def __init__(self, config: AgentConfig):
        """
        Initialize the base agent.

        Args:
            config: Configuration for the agent
        """
        self.config = config
        self.status = AgentStatus.IDLE
        self.tools: List[Tool] = []
        self.tool_functions: Dict[str, Callable] = {}

        # Initialize Vertex AI
        self._initialize_vertexai()

        # Initialize the model
        self._initialize_model()

        logger.info(f"Initialized agent: {self.config.name}")

    def _initialize_vertexai(self) -> None:
        """Initialize Vertex AI with project configuration"""
        try:
            project_id = self.config.project_id or os.getenv("PROJECT_ID")
            location = self.config.location or os.getenv("LOCATION", "us-central1")

            if not project_id:
                logger.warning(
                    "No PROJECT_ID configured. Agent will run in limited mode. "
                    "Set PROJECT_ID environment variable for full functionality."
                )
                self.vertex_initialized = False
                return

            vertexai.init(project=project_id, location=location)
            self.vertex_initialized = True
            logger.info(f"Vertex AI initialized for project: {project_id}")

        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {e}")
            self.vertex_initialized = False

    def _initialize_model(self) -> None:
        """Initialize the generative model"""
        try:
            if not self.vertex_initialized:
                logger.warning("Vertex AI not initialized. Model creation skipped.")
                self.model = None
                return

            # Create generation config
            generation_config = GenerationConfig(
                temperature=self.config.temperature,
                top_p=self.config.top_p,
                top_k=self.config.top_k,
                max_output_tokens=self.config.max_tokens,
            )

            # Initialize model
            self.model = GenerativeModel(
                model_name=self.config.model_name,
                generation_config=generation_config,
                system_instruction=self.config.system_prompt,
            )

            logger.info(f"Model initialized: {self.config.model_name}")

        except Exception as e:
            logger.error(f"Failed to initialize model: {e}")
            self.model = None

    def add_tool(self, tool_name: str, tool_description: str,
                 tool_function: Callable, parameters: Dict[str, Any]) -> None:
        """
        Register a tool that the agent can use.

        Args:
            tool_name: Name of the tool
            tool_description: Description of what the tool does
            tool_function: The function to call when tool is invoked
            parameters: JSON schema describing the function parameters
        """
        try:
            # Create function declaration
            function_declaration = FunctionDeclaration(
                name=tool_name,
                description=tool_description,
                parameters=parameters,
            )

            # Create tool
            tool = Tool(function_declarations=[function_declaration])

            # Register tool
            self.tools.append(tool)
            self.tool_functions[tool_name] = tool_function

            logger.info(f"Tool registered: {tool_name}")

        except Exception as e:
            logger.error(f"Failed to register tool {tool_name}: {e}")

    def _handle_tool_call(self, function_call) -> Any:
        """
        Handle a tool/function call from the model.

        Args:
            function_call: The function call from the model

        Returns:
            Result of the function call
        """
        function_name = function_call.name
        function_args = dict(function_call.args)

        logger.info(f"Executing tool: {function_name} with args: {function_args}")

        if function_name not in self.tool_functions:
            error_msg = f"Tool not found: {function_name}"
            logger.error(error_msg)
            return {"error": error_msg}

        try:
            result = self.tool_functions[function_name](**function_args)
            logger.info(f"Tool {function_name} executed successfully")
            return result
        except Exception as e:
            error_msg = f"Tool execution failed: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}

    def run(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Execute a task with the agent.

        Args:
            task: The task description or prompt
            context: Optional context information

        Returns:
            AgentResponse with the result
        """
        self.status = AgentStatus.RUNNING
        logger.info(f"Agent {self.config.name} starting task: {task[:100]}...")

        try:
            # Pre-process the task (can be overridden)
            processed_task = self.preprocess_task(task, context)

            # Execute the task
            response = self.process_task(processed_task, context)

            # Post-process the response (can be overridden)
            final_response = self.postprocess_response(response)

            self.status = AgentStatus.COMPLETED
            logger.info(f"Agent {self.config.name} completed task successfully")

            return final_response

        except Exception as e:
            self.status = AgentStatus.FAILED
            error_msg = f"Agent execution failed: {str(e)}"
            logger.error(error_msg)

            return AgentResponse(
                agent_name=self.config.name,
                content="",
                status=AgentStatus.FAILED,
                error=error_msg
            )

    def preprocess_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Pre-process the task before execution.
        Can be overridden by subclasses.

        Args:
            task: The task description
            context: Optional context

        Returns:
            Processed task
        """
        return task

    @abstractmethod
    def process_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Process the task. Must be implemented by subclasses.

        Args:
            task: The task to process
            context: Optional context information

        Returns:
            AgentResponse with the result
        """
        pass

    def postprocess_response(self, response: AgentResponse) -> AgentResponse:
        """
        Post-process the response before returning.
        Can be overridden by subclasses.

        Args:
            response: The response to post-process

        Returns:
            Processed response
        """
        return response

    def generate_with_tools(self, prompt: str) -> AgentResponse:
        """
        Generate a response using the model with tool support.

        Args:
            prompt: The prompt to send to the model

        Returns:
            AgentResponse with the result
        """
        if not self.model:
            return AgentResponse(
                agent_name=self.config.name,
                content="",
                status=AgentStatus.FAILED,
                error="Model not initialized"
            )

        try:
            # Start chat
            chat = self.model.start_chat()

            # Send message with tools
            if self.tools:
                response = chat.send_message(prompt, tools=self.tools)
            else:
                response = chat.send_message(prompt)

            # Handle tool calls if any
            tool_calls = []
            while response.candidates[0].content.parts:
                part = response.candidates[0].content.parts[0]

                if hasattr(part, 'function_call'):
                    # Execute the tool
                    function_call = part.function_call
                    tool_result = self._handle_tool_call(function_call)

                    # Record tool call
                    tool_calls.append({
                        "function": function_call.name,
                        "args": dict(function_call.args),
                        "result": tool_result
                    })

                    # Send result back to model
                    response = chat.send_message(
                        Part.from_function_response(
                            name=function_call.name,
                            response={"result": tool_result}
                        )
                    )
                else:
                    break

            # Extract final text response
            content = response.text if hasattr(response, 'text') else str(response)

            return AgentResponse(
                agent_name=self.config.name,
                content=content,
                status=AgentStatus.COMPLETED,
                tool_calls=tool_calls,
                metadata={
                    "model": self.config.model_name,
                    "temperature": self.config.temperature,
                }
            )

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return AgentResponse(
                agent_name=self.config.name,
                content="",
                status=AgentStatus.FAILED,
                error=str(e)
            )

    def collaborate(self, other_agent: 'BaseAgent', task: str) -> Dict[str, AgentResponse]:
        """
        Collaborate with another agent on a task.

        Args:
            other_agent: The agent to collaborate with
            task: The task to work on together

        Returns:
            Dictionary with responses from both agents
        """
        logger.info(f"Collaboration started: {self.config.name} <-> {other_agent.config.name}")

        # This agent processes first
        my_response = self.run(task)

        # Pass result to other agent
        collaboration_context = {
            "previous_agent": self.config.name,
            "previous_response": my_response.content,
        }

        other_response = other_agent.run(
            f"Build upon this previous work:\n{my_response.content}\n\nTask: {task}",
            context=collaboration_context
        )

        return {
            self.config.name: my_response,
            other_agent.config.name: other_response,
        }

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name={self.config.name}, status={self.status.value})>"
