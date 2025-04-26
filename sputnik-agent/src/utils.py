"""Utility functions for the SPUTNIK application."""

import os
import yaml

def load_markdown_instructions(file_path: str) -> str:
    """Load agent instructions from a markdown file, preserving formatting.
    
    This function loads instructions from a markdown file and preserves all
    markdown formatting elements like headers, bold text, lists, etc.
    
    Args:
        file_path: Path to the markdown instructions file
        
    Returns:
        The instructions as a string with markdown formatting preserved
    """
    with open(file_path, "r") as f:
        return f.read().strip()

def update_secrets_from_env(secrets_file: str = "mcp_agent.secrets.yaml"):
    """Update the secrets YAML file with environment variables.
    
    This function reads API keys from environment variables and updates
    the secrets file accordingly. It looks for:
    - OPENAI_API_KEY
    
    Args:
        secrets_file: Path to the secrets YAML file
    """
    # Try to load existing secrets
    try:
        with open(secrets_file, "r") as f:
            secrets = yaml.safe_load(f) or {}
    except FileNotFoundError:
        secrets = {}
    
    # Initialize structure if needed
    if "llm" not in secrets:
        secrets["llm"] = {}
    if "provider" not in secrets["llm"]:
        secrets["llm"]["provider"] = {}
    
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        if "openai" not in secrets["llm"]["provider"]:
            secrets["llm"]["provider"]["openai"] = {}
        secrets["llm"]["provider"]["openai"]["api_key"] = openai_key
    
    # Write updated secrets back to file
    with open(secrets_file, "w") as f:
        yaml.dump(secrets, f, default_flow_style=False)