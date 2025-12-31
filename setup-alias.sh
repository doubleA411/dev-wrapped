#!/bin/bash

# Setup script to create "wrap it" alias for wrap-it command

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_RC="$HOME/.bash_profile"
fi

if [ -z "$SHELL_RC" ]; then
    echo "❌ Could not find shell configuration file (.zshrc, .bashrc, or .bash_profile)"
    exit 1
fi

# Check if alias already exists
if grep -q 'alias "wrap it"' "$SHELL_RC"; then
    echo "✅ Alias 'wrap it' already exists in $SHELL_RC"
else
    echo '' >> "$SHELL_RC"
    echo '# Wrap It - Developer Year End Wrapped' >> "$SHELL_RC"
    echo 'alias "wrap it"="wrap-it"' >> "$SHELL_RC"
    echo "✅ Added 'wrap it' alias to $SHELL_RC"
    echo "💡 Run 'source $SHELL_RC' or restart your terminal to use the alias"
fi

