# openai-messenger-public

<b>Messenger Chatbot</b>

Advanced Facebook Messenger Chatbot

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Changelogs](#changelogs)
- [Credits](#credits)
- [License](#license)

## Installation

Linux/Windows: Use nodejs v15 up.
No need to install modules, required modules are already installed.
<br>
Get your fb login cookie and paste it inside session.json

`git clone -b master https://github.com/suff3r1ng/openai-messenger-public.git`
<br>
`cd openai-messenger-public`<br>

GPT4 Installation Instructions: Linux<br>

Install Python<br>
`sudo apt install python3`<br>
`sudo apt install pip3`<br>
`cd openai-messenger-public`<br>
`pip3 install -r requirements.txt`<br>
Linux `export PYTHONPATH="${PYTHONPATH}:/path/to/your/project/"`<br>
Windows cmd`set PYTHONPATH=%PYTHONPATH%;C:\path\to\your\project\`<br>
`node execute.js`<br>

Grab cf_clearance and user_agent from phind.com under developer tools `Network Tab>Cookies/Network Tab>Headers`<br>

Send this to the bot to set:
`/cf 'your cf_clearance'` set cf_clearance <br>
`/ua 'your user_agent'` set user_agent<br>

## Usage

Functions:<br>

`/help - show list of commands to trigger the bot`<br>
`/forecast 'iNPUT CITY NAME'- show weather forecast.`<br>
`/weather 'INPUT CITY NAME'- show current weather`<br>
`/img 'ANY COMMANDS eg. image of a pug'- Generate an image`<br>
`/ai 'YOUR QUESTION'- Ask the AI gpt-3.5-turbo-0301  `<br>
`/stop - Stop`<br>
`/continue - continue the ai`<br>
`/mp3 - downloads and sends mp3.`<br>
`/define - defines a word.`<br>
`/imgSearch - search image from google`<br>
`/cf - this command sets cf_clearance`
`/ua - this commands sets User-Agent`

## Changelogs:

Added weather.<br>
Added image generator.<br>
Updated to model gpt-3.5-turbo-0301.<br>
Added /define & /mp3 <br>
Added Custom Prompts: unlock full potential<br>
Added gpt4<br>
Added Internet Access<br>
`/gpt4`concise answer
`/gpt4 expert` expert answer
`/dan` the famous DAN><br>
`/dev` unlock Developer mode<br>
`/math` pro at math<br>
`/evil` evil bot<br>
`/aiinternet` gpt3 with internet access<br>

## Credits

- [FB api.](https://github.com/Schmavery/facebook-chat-api/)

- [Openai api.](https://openai.com)

## License

- [GNU](https://www.gnu.org/licenses/gpl-3.0.en.html)

_*suff3r1ng*_
