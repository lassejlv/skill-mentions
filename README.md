# skill-mentions

A Claude Code mod that adds skill autocomplete to the prompt box. Type `$` and a popup lists your skills, the way `@` lists files. Keep typing to narrow the list (`$rust`, `$review`); pick a row to insert `$skill-name`.

When you send a prompt that mentions a skill, such as `$frontend-design build a pricing page`, the mod adds a note for Claude asking it to load that skill with the Skill tool before it starts.

The list covers skills from plugins and your own skills and commands. Built-in commands and MCP prompts are left out.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install skill-mentions --marketplace lassejlv/skill-mentions
```

Or from a shell:

```
claude plugin install skill-mentions --marketplace lassejlv/skill-mentions
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `lassejlv/skill-mentions`, then Add plugin.

## License

MIT
