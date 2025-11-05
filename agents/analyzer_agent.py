"""
Analyzer Agent Implementation

This agent specializes in analyzing data, code, and content to provide insights.
"""

import logging
from typing import Any, Dict, Optional

from agents.base_agent import BaseAgent, AgentConfig, AgentResponse, AgentStatus

logger = logging.getLogger(__name__)


class AnalyzerAgent(BaseAgent):
    """
    Agent specialized in analysis and insight generation.

    Capabilities:
    - Data analysis
    - Code review
    - Sentiment analysis
    - Pattern recognition
    """

    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the analyzer agent.

        Args:
            config: Optional custom configuration. If not provided, uses defaults.
        """
        if config is None:
            config = AgentConfig(
                name="AnalyzerAgent",
                model_name="gemini-2.5-flash-preview-5-20",
                temperature=0.3,  # Lower temperature for analytical precision
                system_prompt="""You are an analytical agent. Your role is to:
                - Analyze data and identify patterns
                - Provide actionable insights
                - Generate structured reports
                - Evaluate quality and accuracy

                Be precise, logical, and data-driven in your analysis."""
            )

        super().__init__(config)

    def process_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Process an analysis task.

        Args:
            task: The analysis request
            context: Optional context information

        Returns:
            AgentResponse with analysis results
        """
        logger.info(f"Analyzer processing task: {task[:100]}...")

        # Format analysis prompt
        analysis_prompt = self._format_analysis_prompt(task, context)

        # Generate response with tools
        response = self.generate_with_tools(analysis_prompt)

        return response

    def _format_analysis_prompt(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Format the analysis prompt with task and context.

        Args:
            task: The analysis task
            context: Optional context

        Returns:
            Formatted prompt
        """
        prompt = f"Analysis Task: {task}\n\n"

        if context:
            prompt += "Data/Context to Analyze:\n"
            for key, value in context.items():
                prompt += f"- {key}: {value}\n"
            prompt += "\n"

        prompt += """
Please provide a thorough analysis:

1. Identify key patterns and trends
2. Evaluate data quality and reliability
3. Draw evidence-based conclusions
4. Highlight implications and insights
5. Provide actionable recommendations

Present your analysis in a clear, structured format.
"""

        return prompt

    def analyze_code(self, code: str, language: str = "python") -> str:
        """
        Analyze code for quality, bugs, and improvements.

        Args:
            code: The code to analyze
            language: Programming language

        Returns:
            Code analysis report
        """
        context = {
            "code": code,
            "language": language
        }

        task = f"Analyze this {language} code for:\n" \
               "- Code quality and maintainability\n" \
               "- Potential bugs or issues\n" \
               "- Performance optimization opportunities\n" \
               "- Best practices and standards\n"

        response = self.run(task, context=context)
        return response.content

    def analyze_sentiment(self, text: str) -> str:
        """
        Analyze sentiment of text.

        Args:
            text: Text to analyze

        Returns:
            Sentiment analysis report
        """
        context = {"text": text}

        task = "Analyze the sentiment of this text:\n" \
               "- Overall sentiment (positive/negative/neutral)\n" \
               "- Emotional tone\n" \
               "- Key themes\n" \
               "- Intensity of emotions\n"

        response = self.run(task, context=context)
        return response.content
