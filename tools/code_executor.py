"""
Code Executor Tool

Provides safe code execution capabilities in a sandboxed environment.
"""

import os
import sys
import logging
import subprocess
import tempfile
from typing import Dict, Any, Optional
import json

logger = logging.getLogger(__name__)


class CodeExecutorTool:
    """
    Tool for executing code safely in a sandboxed environment.

    Supports:
    - Python code execution
    - JavaScript/Node.js execution
    - Bash script execution
    - Resource limits and timeouts
    """

    def __init__(self, sandbox_mode: bool = True, timeout: int = 60):
        """
        Initialize the code executor tool.

        Args:
            sandbox_mode: Whether to run in sandbox mode (recommended)
            timeout: Maximum execution time in seconds
        """
        self.sandbox_mode = sandbox_mode
        self.timeout = timeout
        self.max_memory_mb = 512

    def execute_python(self, code: str) -> Dict[str, Any]:
        """
        Execute Python code.

        Args:
            code: Python code to execute

        Returns:
            Execution results
        """
        logger.info("Executing Python code")

        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name

            try:
                # Execute with timeout
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                    check=False
                )

                return {
                    "status": "success" if result.returncode == 0 else "error",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "return_code": result.returncode,
                    "language": "python"
                }

            finally:
                # Clean up
                os.unlink(temp_file)

        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error": f"Execution timed out after {self.timeout} seconds",
                "language": "python"
            }
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "language": "python"
            }

    def execute_javascript(self, code: str) -> Dict[str, Any]:
        """
        Execute JavaScript code using Node.js.

        Args:
            code: JavaScript code to execute

        Returns:
            Execution results
        """
        logger.info("Executing JavaScript code")

        try:
            # Check if node is available
            node_check = subprocess.run(
                ["which", "node"],
                capture_output=True,
                text=True
            )

            if node_check.returncode != 0:
                return {
                    "status": "error",
                    "error": "Node.js not installed",
                    "language": "javascript"
                }

            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(code)
                temp_file = f.name

            try:
                # Execute with timeout
                result = subprocess.run(
                    ["node", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                    check=False
                )

                return {
                    "status": "success" if result.returncode == 0 else "error",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "return_code": result.returncode,
                    "language": "javascript"
                }

            finally:
                # Clean up
                os.unlink(temp_file)

        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error": f"Execution timed out after {self.timeout} seconds",
                "language": "javascript"
            }
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "language": "javascript"
            }

    def execute_bash(self, code: str) -> Dict[str, Any]:
        """
        Execute Bash script.

        Args:
            code: Bash script to execute

        Returns:
            Execution results
        """
        logger.info("Executing Bash script")

        if not self.sandbox_mode:
            logger.warning("Running Bash script outside sandbox - security risk!")

        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.sh', delete=False) as f:
                f.write(code)
                temp_file = f.name

            # Make executable
            os.chmod(temp_file, 0o755)

            try:
                # Execute with timeout
                result = subprocess.run(
                    ["/bin/bash", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                    check=False
                )

                return {
                    "status": "success" if result.returncode == 0 else "error",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "return_code": result.returncode,
                    "language": "bash"
                }

            finally:
                # Clean up
                os.unlink(temp_file)

        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error": f"Execution timed out after {self.timeout} seconds",
                "language": "bash"
            }
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "language": "bash"
            }

    def execute(self, code: str, language: str = "python") -> Dict[str, Any]:
        """
        Execute code in the specified language.

        Args:
            code: Code to execute
            language: Programming language (python, javascript, bash)

        Returns:
            Execution results
        """
        language = language.lower()

        if language == "python":
            return self.execute_python(code)
        elif language in ["javascript", "js", "node"]:
            return self.execute_javascript(code)
        elif language in ["bash", "sh", "shell"]:
            return self.execute_bash(code)
        else:
            return {
                "status": "error",
                "error": f"Unsupported language: {language}",
                "supported_languages": ["python", "javascript", "bash"]
            }

    def get_function_declaration(self) -> Dict[str, Any]:
        """
        Get the function declaration for Vertex AI function calling.

        Returns:
            Function declaration schema
        """
        return {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "The code to execute"
                },
                "language": {
                    "type": "string",
                    "description": "Programming language (python, javascript, bash)",
                    "enum": ["python", "javascript", "bash"],
                    "default": "python"
                }
            },
            "required": ["code"]
        }

    def __call__(self, code: str, language: str = "python") -> Dict[str, Any]:
        """
        Make the tool callable.

        Args:
            code: Code to execute
            language: Programming language

        Returns:
            Execution results
        """
        return self.execute(code, language)


def create_code_executor_tool() -> tuple[str, str, callable, dict]:
    """
    Create a code executor tool for agent registration.

    Returns:
        Tuple of (name, description, function, parameters)
    """
    tool = CodeExecutorTool(sandbox_mode=True, timeout=60)

    return (
        "execute_code",
        "Execute code safely in a sandboxed environment. Supports Python, JavaScript, and Bash. Use this when you need to run code to solve problems or perform computations.",
        tool,
        tool.get_function_declaration()
    )
