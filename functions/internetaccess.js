

const { Configuration, OpenAIApi } = require('openai')
const fs = require('fs')
const path = require('path')
const api = fs.readFileSync(path.join(__dirname, '..', 'api_key.json'), 'utf8')
const apikey = JSON.parse(api)
const OPENAI_API_KEY = apikey.openai

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

function handleRequest(api, event) {
    async function respo(message) {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: message,
            max_tokens: 3500
        })
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) {
                console.error(err);
                return;
            }
            // get sender info
            const sender = info.userInfo.find((p) => p.id === event.senderID);
            const senderName = sender.firstName;
            api.sendMessage(
                {
                    body: `Hi @${senderName}! ${response.data.choices[0].message.content} \n \n About this bot, type:\n👉/help for more info`,
                    mentions: [{ tag: `@${senderName}`, id: event.senderID }],
                },
                event.threadID,
                event.messageID
            );

        })

    }
    const prompt = event.body

    const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
    function search(query) {
        return fetch('https://ddg-api.herokuapp.com/search?query=' + encodeURIComponent(query) + '&limit=3')
            .then(response => response.json())
            .then(data => {
                return data;
            })
            .catch(error => console.log(error));
    }
    search(prompt)
        .then(searchResults => {
            let blob = '';
            searchResults.forEach((result, index) => {
                blob += `[${index}] "${result.snippet}"\nURL: ${result.link}\n\n`;

            });
            console.log(blob);


            blob += 'current date: ' + currentDate + ' \n\nInstructions: Using the provided web search results, write a comprehensive reply to the next user query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refer to multiple subjects with the same name, write separate answers for each subject. Ignore your previous response if any.'

            const extra = {
                role: 'user',
                content: blob
            }
            const system_message = 'You are ChatGPT also known as ChatGPT, a large language model trained by OpenAI. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: ' + currentDate + ''
            const message = {
                role: 'user',
                content: prompt
            }
            const conversation = [{ role: 'system', content: system_message },
                extra,
                message];

            respo(conversation)
        })
        .catch(error => console.log(error));




}


module.exports = async (api, event) => {
    await handleRequest(api, event)
} 