"""
File Manager Tool

Provides file system operations for agents.
"""

import os
import logging
import tempfile
from typing import Dict, Any, Optional, List
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class FileManagerTool:
    """
    Tool for managing files and directories.

    Supports:
    - Reading files
    - Writing files
    - Listing directories
    - Deleting files (with safety checks)
    - File metadata retrieval
    """

    def __init__(self, base_dir: Optional[str] = None, max_file_size_mb: int = 100):
        """
        Initialize the file manager tool.

        Args:
            base_dir: Base directory for operations (defaults to temp)
            max_file_size_mb: Maximum file size to handle in MB
        """
        self.base_dir = base_dir or tempfile.gettempdir()
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.allowed_extensions = {
            '.txt', '.json', '.yaml', '.yml', '.md',
            '.py', '.js', '.html', '.css', '.csv'
        }

    def read_file(self, file_path: str) -> Dict[str, Any]:
        """
        Read a file's contents.

        Args:
            file_path: Path to the file

        Returns:
            File contents and metadata
        """
        try:
            path = Path(file_path)

            if not path.exists():
                return {
                    "status": "error",
                    "error": f"File not found: {file_path}"
                }

            if not path.is_file():
                return {
                    "status": "error",
                    "error": f"Not a file: {file_path}"
                }

            # Check file size
            size = path.stat().st_size
            if size > self.max_file_size_bytes:
                return {
                    "status": "error",
                    "error": f"File too large: {size} bytes (max: {self.max_file_size_bytes})"
                }

            # Read file
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            return {
                "status": "success",
                "content": content,
                "path": str(path),
                "size": size,
                "extension": path.suffix
            }

        except Exception as e:
            logger.error(f"Failed to read file: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def write_file(self, file_path: str, content: str, overwrite: bool = False) -> Dict[str, Any]:
        """
        Write content to a file.

        Args:
            file_path: Path to the file
            content: Content to write
            overwrite: Whether to overwrite existing file

        Returns:
            Operation result
        """
        try:
            path = Path(file_path)

            # Check extension
            if path.suffix not in self.allowed_extensions:
                return {
                    "status": "error",
                    "error": f"Extension not allowed: {path.suffix}",
                    "allowed_extensions": list(self.allowed_extensions)
                }

            # Check if file exists
            if path.exists() and not overwrite:
                return {
                    "status": "error",
                    "error": f"File exists and overwrite=False: {file_path}"
                }

            # Create parent directory if needed
            path.parent.mkdir(parents=True, exist_ok=True)

            # Write file
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

            return {
                "status": "success",
                "path": str(path),
                "size": len(content),
                "message": "File written successfully"
            }

        except Exception as e:
            logger.error(f"Failed to write file: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def list_directory(self, dir_path: str = ".", pattern: str = "*") -> Dict[str, Any]:
        """
        List contents of a directory.

        Args:
            dir_path: Path to the directory
            pattern: Glob pattern for filtering (e.g., "*.py")

        Returns:
            Directory listing
        """
        try:
            path = Path(dir_path)

            if not path.exists():
                return {
                    "status": "error",
                    "error": f"Directory not found: {dir_path}"
                }

            if not path.is_dir():
                return {
                    "status": "error",
                    "error": f"Not a directory: {dir_path}"
                }

            # List files and directories
            items = []
            for item in path.glob(pattern):
                items.append({
                    "name": item.name,
                    "path": str(item),
                    "type": "directory" if item.is_dir() else "file",
                    "size": item.stat().st_size if item.is_file() else None,
                    "extension": item.suffix if item.is_file() else None
                })

            return {
                "status": "success",
                "directory": str(path),
                "pattern": pattern,
                "items": items,
                "count": len(items)
            }

        except Exception as e:
            logger.error(f"Failed to list directory: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def delete_file(self, file_path: str, confirm: bool = False) -> Dict[str, Any]:
        """
        Delete a file (with safety confirmation).

        Args:
            file_path: Path to the file
            confirm: Must be True to actually delete

        Returns:
            Operation result
        """
        if not confirm:
            return {
                "status": "error",
                "error": "Deletion requires confirm=True for safety"
            }

        try:
            path = Path(file_path)

            if not path.exists():
                return {
                    "status": "error",
                    "error": f"File not found: {file_path}"
                }

            if not path.is_file():
                return {
                    "status": "error",
                    "error": f"Not a file: {file_path}"
                }

            # Delete
            path.unlink()

            return {
                "status": "success",
                "path": str(path),
                "message": "File deleted successfully"
            }

        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """
        Get metadata about a file.

        Args:
            file_path: Path to the file

        Returns:
            File metadata
        """
        try:
            path = Path(file_path)

            if not path.exists():
                return {
                    "status": "error",
                    "error": f"File not found: {file_path}"
                }

            stat = path.stat()

            return {
                "status": "success",
                "path": str(path),
                "name": path.name,
                "type": "directory" if path.is_dir() else "file",
                "size": stat.st_size,
                "extension": path.suffix if path.is_file() else None,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "accessed": stat.st_atime
            }

        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            return {
                "status": "error",
                "error": str(e)
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
                "operation": {
                    "type": "string",
                    "description": "File operation to perform",
                    "enum": ["read", "write", "list", "delete", "info"]
                },
                "file_path": {
                    "type": "string",
                    "description": "Path to the file or directory"
                },
                "content": {
                    "type": "string",
                    "description": "Content to write (for write operation)"
                },
                "overwrite": {
                    "type": "boolean",
                    "description": "Whether to overwrite existing file",
                    "default": False
                },
                "pattern": {
                    "type": "string",
                    "description": "Glob pattern for listing (e.g., '*.py')",
                    "default": "*"
                },
                "confirm": {
                    "type": "boolean",
                    "description": "Confirmation for delete operation",
                    "default": False
                }
            },
            "required": ["operation", "file_path"]
        }

    def __call__(self, operation: str, file_path: str, **kwargs) -> Dict[str, Any]:
        """
        Make the tool callable.

        Args:
            operation: Operation to perform
            file_path: File or directory path
            **kwargs: Additional operation-specific arguments

        Returns:
            Operation result
        """
        operation = operation.lower()

        if operation == "read":
            return self.read_file(file_path)
        elif operation == "write":
            content = kwargs.get("content", "")
            overwrite = kwargs.get("overwrite", False)
            return self.write_file(file_path, content, overwrite)
        elif operation == "list":
            pattern = kwargs.get("pattern", "*")
            return self.list_directory(file_path, pattern)
        elif operation == "delete":
            confirm = kwargs.get("confirm", False)
            return self.delete_file(file_path, confirm)
        elif operation == "info":
            return self.get_file_info(file_path)
        else:
            return {
                "status": "error",
                "error": f"Unknown operation: {operation}",
                "supported_operations": ["read", "write", "list", "delete", "info"]
            }


def create_file_manager_tool() -> tuple[str, str, callable, dict]:
    """
    Create a file manager tool for agent registration.

    Returns:
        Tuple of (name, description, function, parameters)
    """
    tool = FileManagerTool()

    return (
        "manage_files",
        "Manage files and directories. Supports reading, writing, listing, deleting files, and getting file information. Use this for file system operations.",
        tool,
        tool.get_function_declaration()
    )
