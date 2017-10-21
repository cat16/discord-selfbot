# discord-selfbot
This is my original discord.js selfbot.
## Commands
`Command`s are a restrictive and formal way to get the bot to do stuff. The command handler is essentially the base `Parser`. There are already a variety of commands to start you off, some of which will be disablable.

Here's there properties:
 - name - the name of the command; used to trigger it
 - description - a brief overview of what the command does
 - aliases - more words that will trigger it
 - handleFunc - the function that will be run when the command handler detects it
 - args - a list of `Arg`s that determine what will be put into the handleFunc
 ## Parsers
 `Parser`s are a way to handle text they way you want. It simply gives you text to deal with and you can do whatever you'd like with it. You could even make your own command handler if you wanted to. There is already a default parser with simple stuff such as replacing lenny faces

 Here
 - name - the name of the parser
 - description - a brief overview of what it does
 - parseFunc - the
 - saveFunc
 - loadFunc