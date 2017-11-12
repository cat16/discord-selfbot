# discord-selfbot
This is my original discord.js extendable/modular selfbot.
## Commands
Commands are a restrictive and formal way to get the bot to do stuff. The command handler is essentially the base parser. There are already a variety of commands to start you off, some of which will be disablable.

Here's the properties of a command:
- name - the name of the command; used to trigger it
- description - ae brief overview of what the command does. Technically optional, but should be provided.
- aliases - more optional words that will trigger it
- args - an optional list of Args that determine what will be put into the handleFunc
- run - the function that will be run when the command handler detects it
## Parsers
Parsers are a way to handle text they way you want. It simply gives you text to deal with and you can do whatever you'd like with it. You could even make your own command handler if you wanted to. There is already a default parser with simple stuff such as replacing lenny faces

Here's the properties of a parser:
- name - the name of the parser
- description - a brief overview of what it does
- parseFunc - the
- saveFunc
- loadFunc