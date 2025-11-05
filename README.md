# AI Agent System on Google Cloud

A production-ready multi-agent AI framework built on Google Cloud's Vertex AI platform, featuring the Gemini 2.5 Flash model and Agent Development Kit (ADK).

## 🌟 Features

- **Multi-Agent Architecture**: Specialized agents (Researcher, Analyzer, Orchestrator) working together
- **Flexible Tool System**: Custom tools for web search, code execution, and file management
- **Production-Ready**: Proper error handling, logging, testing, and deployment configurations
- **Google Cloud Native**: Built on Vertex AI with Gemini 2.5 Flash
- **Scalable Deployment**: Support for Agent Engine, Cloud Run, and GKE
- **9-S Creative Pipeline**: Framework for implementing the universal creative process

## 📁 Project Structure

```
ai-agents-google-expriment/
├── agents/                    # Agent implementations
│   ├── base_agent.py         # Abstract base agent class
│   ├── researcher_agent.py   # Research specialist
│   ├── analyzer_agent.py     # Analysis specialist
│   └── orchestrator_agent.py # Multi-agent coordinator
├── tools/                     # Custom tools
│   ├── web_search.py         # Web search functionality
│   ├── code_executor.py      # Safe code execution
│   └── file_manager.py       # File operations
├── config/                    # Configuration files
│   ├── agent_config.yaml     # Agent configurations
│   ├── deployment.yaml       # Deployment settings
│   └── prompts.yaml          # System prompts library
├── tests/                     # Unit and integration tests
│   ├── test_agents.py
│   ├── test_tools.py
│   └── test_integration.py
├── examples/                  # Example implementations
│   ├── simple_agent.py       # Basic agent example
│   └── multi_agent_demo.py   # Multi-agent collaboration
├── deploy/                    # Deployment configurations
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   └── terraform/
├── requirements.txt           # Python dependencies
├── pyproject.toml            # Project metadata
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Google Cloud Platform account
- Vertex AI API enabled
- (Optional) Google Cloud SDK for deployment

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ai-agents-google-expriment
```

2. **Create virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `PROJECT_ID`: Your Google Cloud project ID
- `LOCATION`: Google Cloud region (default: us-central1)

5. **Authenticate with Google Cloud**

```bash
gcloud auth application-default login
```

### Running Examples

#### Simple Agent

```bash
python examples/simple_agent.py
```

This demonstrates:
- Basic agent initialization
- Tool registration (web search)
- Task execution
- Response handling

#### Multi-Agent Demo

```bash
python examples/multi_agent_demo.py
```

This demonstrates:
- Multiple specialized agents
- Sequential workflows
- Parallel workflows
- Agent-to-agent collaboration

## 📚 Usage Guide

### Creating a Basic Agent

```python
from agents.base_agent import BaseAgent, AgentConfig, AgentResponse

# Define custom agent
class MyAgent(BaseAgent):
    def process_task(self, task: str, context=None) -> AgentResponse:
        return self.generate_with_tools(task)

# Configure and create agent
config = AgentConfig(
    name="MyAgent",
    model_name="gemini-2.5-flash-preview-5-20",
    temperature=0.7,
    system_prompt="You are a helpful AI assistant."
)

agent = MyAgent(config)

# Run a task
response = agent.run("What is Google Cloud Vertex AI?")
print(response.content)
```

### Adding Tools to Agents

```python
from tools.web_search import create_web_search_tool

# Create and register tool
tool_name, tool_desc, tool_func, tool_params = create_web_search_tool()
agent.add_tool(tool_name, tool_desc, tool_func, tool_params)

# Agent can now use web search
response = agent.run("Search for latest AI news")
```

### Multi-Agent Orchestration

```python
from agents.researcher_agent import ResearcherAgent
from agents.analyzer_agent import AnalyzerAgent
from agents.orchestrator_agent import OrchestratorAgent

# Create specialized agents
researcher = ResearcherAgent()
analyzer = AnalyzerAgent()
orchestrator = OrchestratorAgent()

# Register agents
orchestrator.register_agent(researcher)
orchestrator.register_agent(analyzer)

# Execute sequential workflow
tasks = [
    {
        "agent_name": "ResearcherAgent",
        "task": "Research quantum computing",
        "context": {}
    },
    {
        "agent_name": "AnalyzerAgent",
        "task": "Analyze the research findings",
        "context": {}
    }
]

results = orchestrator.execute_sequential_workflow(tasks)
```

### Agent-to-Agent Collaboration

```python
# Direct collaboration between two agents
task = "Explain neural networks"
results = researcher.collaborate(analyzer, task)

# Access individual responses
researcher_response = results["ResearcherAgent"]
analyzer_response = results["AnalyzerAgent"]
```

## 🧪 Testing

Run the test suite:

```bash
# All tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov

# Specific test file
pytest tests/test_agents.py -v

# Specific test
pytest tests/test_agents.py::TestBaseAgent::test_agent_initialization -v
```

## 🔧 Configuration

### Agent Configuration (`config/agent_config.yaml`)

Configure agent behavior, prompts, and tools:

```yaml
agents:
  researcher:
    name: "ResearcherAgent"
    temperature: 0.5
    max_tokens: 8192
    tools:
      - web_search
      - fetch_url
```

### Deployment Configuration (`config/deployment.yaml`)

Configure deployment targets:

```yaml
cloud_run:
  service_name: "ai-agent-system"
  region: "us-central1"
  resources:
    cpu: "2"
    memory: "4Gi"
```

## 🚢 Deployment

### Local Development

```bash
# Set environment variables
export PROJECT_ID=your-project-id
export LOCATION=us-central1

# Run examples
python examples/simple_agent.py
```

### Deploy to Cloud Run

```bash
# Build container
gcloud builds submit --config deploy/cloudbuild.yaml

# Deploy
gcloud run deploy ai-agent-system \
  --image gcr.io/${PROJECT_ID}/ai-agent-system \
  --region us-central1 \
  --platform managed
```

### Deploy to Agent Engine

```bash
# Deploy using Vertex AI Agent Engine
# (Configuration in config/deployment.yaml)

# See documentation:
# https://docs.cloud.google.com/agent-builder/agent-engine/develop/overview
```

## 🏗️ Architecture

### Agent Hierarchy

```
BaseAgent (Abstract)
├── ResearcherAgent (Information gathering)
├── AnalyzerAgent (Data analysis)
├── OrchestratorAgent (Coordination)
└── Custom agents...
```

### Tool System

Tools are registered with agents using function declarations:

1. Create tool class with methods
2. Implement `get_function_declaration()` for Vertex AI
3. Register with agent using `add_tool()`
4. Agent can invoke tool during execution

### Workflow Patterns

- **Sequential**: Tasks executed in order, output flows forward
- **Parallel**: Independent tasks executed concurrently
- **Collaborative**: Agents build upon each other's work

## 🎯 9-S Creative Pipeline

The system supports implementing the universal creative process:

1. **Silent**: Capture the initial spark
2. **Souls**: Define identity and purpose
3. **Story**: Structure narrative
4. **Script**: Create detailed blueprint
5. **Scene**: Generate components
6. **Science**: AI orchestration
7. **Screen**: Assembly and testing
8. **Spread**: Distribution
9. **CINEMA**: Master orchestration

See `config/agent_config.yaml` and `config/prompts.yaml` for agent configurations.

## 📊 Monitoring and Observability

### Logging

The system uses Python's `logging` module:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

### Cloud Logging

When deployed to Google Cloud, logs automatically flow to Cloud Logging.

### Metrics

Track agent performance:
- Execution time
- Success rate
- Tool invocation count
- Error rate

## 🔒 Security

- **Sandboxed Execution**: Code execution in isolated environments
- **Input Validation**: All inputs validated before processing
- **Secret Management**: Use Google Secret Manager for credentials
- **Authentication**: Service account authentication for GCP
- **File Access Control**: Restricted file operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 Development Workflow

```bash
# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env

# Test
pytest tests/ -v --cov

# Run
python examples/simple_agent.py

# Deploy
./deploy/deploy.sh
```

## 🐛 Troubleshooting

### Vertex AI Not Initialized

**Error**: "Model not initialized"

**Solution**: Set `PROJECT_ID` environment variable:
```bash
export PROJECT_ID=your-gcp-project-id
```

### Authentication Errors

**Error**: "Could not automatically determine credentials"

**Solution**: Authenticate with Google Cloud:
```bash
gcloud auth application-default login
```

### Import Errors

**Error**: "No module named 'agents'"

**Solution**: Run from project root or install package:
```bash
# From project root
python examples/simple_agent.py

# Or install in development mode
pip install -e .
```

## 📖 Documentation

### Key Concepts

- **Agent**: Autonomous entity that performs tasks using LLM
- **Tool**: Function that agents can invoke to perform actions
- **Orchestrator**: Agent that coordinates other agents
- **Workflow**: Sequence or pattern of agent execution

### Best Practices

1. **Use appropriate temperature**: Lower (0.3-0.5) for analytical tasks, higher (0.7-0.9) for creative tasks
2. **Register relevant tools**: Only add tools agents actually need
3. **Handle errors gracefully**: Always check response status and error field
4. **Use context effectively**: Pass relevant information between agents
5. **Monitor performance**: Track execution time and success rates

## 🔗 Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Agent Development Kit (ADK)](https://google.github.io/adk-docs/)
- [Agent Engine Overview](https://docs.cloud.google.com/agent-builder/agent-engine/develop/overview)

## 📄 License

[Your License Here]

## ✨ Acknowledgments

Built with:
- Google Cloud Vertex AI
- Gemini 2.5 Flash
- Agent Development Kit (ADK)
- Python 3.11+

---

**Need Help?** Open an issue or consult the [documentation](https://cloud.google.com/vertex-ai/docs).
