"""
Unit tests for tool implementations
"""

import pytest
import tempfile
import os
from pathlib import Path

from tools.web_search import WebSearchTool, create_web_search_tool
from tools.code_executor import CodeExecutorTool, create_code_executor_tool
from tools.file_manager import FileManagerTool, create_file_manager_tool


class TestWebSearchTool:
    """Tests for WebSearchTool"""

    def test_tool_initialization(self):
        """Test tool initialization"""
        tool = WebSearchTool()

        assert tool.base_url == "https://www.googleapis.com/customsearch/v1"

    def test_simulated_search(self):
        """Test simulated search (no API key)"""
        tool = WebSearchTool()

        result = tool.search("test query", num_results=3)

        assert result["status"] == "success"
        assert result["simulated"] == True
        assert len(result["results"]) == 3
        assert result["query"] == "test query"

    def test_search_result_structure(self):
        """Test search result structure"""
        tool = WebSearchTool()

        result = tool.search("test")

        assert "query" in result
        assert "num_results" in result
        assert "results" in result
        assert "status" in result

        if result["results"]:
            first_result = result["results"][0]
            assert "title" in first_result
            assert "link" in first_result
            assert "snippet" in first_result

    def test_create_tool_function(self):
        """Test tool creation function"""
        name, desc, func, params = create_web_search_tool()

        assert name == "web_search"
        assert callable(func)
        assert "type" in params
        assert "properties" in params

    def test_function_declaration(self):
        """Test function declaration schema"""
        tool = WebSearchTool()
        declaration = tool.get_function_declaration()

        assert declaration["type"] == "object"
        assert "properties" in declaration
        assert "query" in declaration["properties"]
        assert "required" in declaration

    def test_callable_interface(self):
        """Test callable interface"""
        tool = WebSearchTool()

        result = tool("test query", num_results=2)

        assert result["status"] == "success"
        assert len(result["results"]) == 2


class TestCodeExecutorTool:
    """Tests for CodeExecutorTool"""

    def test_tool_initialization(self):
        """Test tool initialization"""
        tool = CodeExecutorTool(sandbox_mode=True, timeout=30)

        assert tool.sandbox_mode == True
        assert tool.timeout == 30
        assert tool.max_memory_mb == 512

    def test_execute_python_simple(self):
        """Test simple Python execution"""
        tool = CodeExecutorTool()

        code = "print('Hello, World!')"
        result = tool.execute_python(code)

        assert result["status"] == "success"
        assert "Hello, World!" in result["stdout"]
        assert result["return_code"] == 0

    def test_execute_python_with_output(self):
        """Test Python execution with output"""
        tool = CodeExecutorTool()

        code = """
x = 10
y = 20
print(f'Sum: {x + y}')
"""
        result = tool.execute_python(code)

        assert result["status"] == "success"
        assert "Sum: 30" in result["stdout"]

    def test_execute_python_with_error(self):
        """Test Python execution with error"""
        tool = CodeExecutorTool()

        code = "print(undefined_variable)"
        result = tool.execute_python(code)

        assert result["status"] == "error"
        assert result["return_code"] != 0
        assert len(result["stderr"]) > 0

    def test_execute_bash_simple(self):
        """Test simple Bash execution"""
        tool = CodeExecutorTool()

        code = "echo 'Hello from Bash'"
        result = tool.execute_bash(code)

        assert result["status"] == "success"
        assert "Hello from Bash" in result["stdout"]

    def test_execute_unsupported_language(self):
        """Test unsupported language"""
        tool = CodeExecutorTool()

        result = tool.execute("print('test')", language="ruby")

        assert result["status"] == "error"
        assert "Unsupported language" in result["error"]

    def test_function_declaration(self):
        """Test function declaration schema"""
        tool = CodeExecutorTool()
        declaration = tool.get_function_declaration()

        assert declaration["type"] == "object"
        assert "code" in declaration["properties"]
        assert "language" in declaration["properties"]

    def test_create_tool_function(self):
        """Test tool creation function"""
        name, desc, func, params = create_code_executor_tool()

        assert name == "execute_code"
        assert callable(func)
        assert "properties" in params

    def test_callable_interface(self):
        """Test callable interface"""
        tool = CodeExecutorTool()

        result = tool("print('test')", language="python")

        assert result["status"] == "success"
        assert "test" in result["stdout"]


class TestFileManagerTool:
    """Tests for FileManagerTool"""

    def test_tool_initialization(self):
        """Test tool initialization"""
        tool = FileManagerTool()

        assert tool.max_file_size_bytes == 100 * 1024 * 1024
        assert len(tool.allowed_extensions) > 0

    def test_write_and_read_file(self):
        """Test writing and reading a file"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            file_path = os.path.join(tmpdir, "test.txt")
            content = "Hello, World!"

            # Write
            write_result = tool.write_file(file_path, content, overwrite=False)
            assert write_result["status"] == "success"

            # Read
            read_result = tool.read_file(file_path)
            assert read_result["status"] == "success"
            assert read_result["content"] == content

    def test_write_file_overwrite(self):
        """Test file overwrite protection"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            file_path = os.path.join(tmpdir, "test.txt")

            # Write first time
            tool.write_file(file_path, "first", overwrite=False)

            # Try to write again without overwrite
            result = tool.write_file(file_path, "second", overwrite=False)
            assert result["status"] == "error"
            assert "exists" in result["error"].lower()

            # Write with overwrite
            result = tool.write_file(file_path, "second", overwrite=True)
            assert result["status"] == "success"

    def test_list_directory(self):
        """Test directory listing"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            # Create test files
            Path(tmpdir, "test1.txt").write_text("test")
            Path(tmpdir, "test2.txt").write_text("test")
            Path(tmpdir, "test.json").write_text("{}")

            # List all
            result = tool.list_directory(tmpdir)
            assert result["status"] == "success"
            assert result["count"] >= 3

            # List with pattern
            result = tool.list_directory(tmpdir, pattern="*.txt")
            assert result["status"] == "success"
            assert result["count"] == 2

    def test_delete_file(self):
        """Test file deletion"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            file_path = os.path.join(tmpdir, "test.txt")
            Path(file_path).write_text("test")

            # Try to delete without confirm
            result = tool.delete_file(file_path, confirm=False)
            assert result["status"] == "error"

            # Delete with confirm
            result = tool.delete_file(file_path, confirm=True)
            assert result["status"] == "success"
            assert not os.path.exists(file_path)

    def test_get_file_info(self):
        """Test getting file metadata"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            file_path = os.path.join(tmpdir, "test.txt")
            content = "test content"
            Path(file_path).write_text(content)

            result = tool.get_file_info(file_path)

            assert result["status"] == "success"
            assert result["name"] == "test.txt"
            assert result["type"] == "file"
            assert result["size"] == len(content)

    def test_extension_restriction(self):
        """Test file extension restrictions"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            file_path = os.path.join(tmpdir, "test.exe")

            result = tool.write_file(file_path, "content")

            assert result["status"] == "error"
            assert "not allowed" in result["error"].lower()

    def test_callable_interface(self):
        """Test callable interface"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tool = FileManagerTool(base_dir=tmpdir)

            file_path = os.path.join(tmpdir, "test.txt")

            # Write operation
            result = tool(operation="write", file_path=file_path, content="test")
            assert result["status"] == "success"

            # Read operation
            result = tool(operation="read", file_path=file_path)
            assert result["status"] == "success"
            assert result["content"] == "test"

    def test_function_declaration(self):
        """Test function declaration schema"""
        tool = FileManagerTool()
        declaration = tool.get_function_declaration()

        assert declaration["type"] == "object"
        assert "operation" in declaration["properties"]
        assert "file_path" in declaration["properties"]

    def test_create_tool_function(self):
        """Test tool creation function"""
        name, desc, func, params = create_file_manager_tool()

        assert name == "manage_files"
        assert callable(func)
        assert "properties" in params


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
