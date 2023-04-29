
import concise
import sys
import os
import requests
prompt = sys.stdin.readline()

if os.path.isfile('cf_clearance.txt'):
    # read the text from cf_clearance.txt
    with open('cf_clearance.txt', 'r') as f:
        concise.cf_clearance = f.read().strip()
else:
    concise.cf_clearance = ''

if os.path.isfile('user_agent.txt'):
    # read the text from cf_clearance.txt
    with open('user_agent.txt', 'r') as f:
        concise.user_agent = f.read().strip()
else:
    concise.user_agent = ''


def phind_get_answer(question: str) -> str:
    # set cf_clearance cookie
    try:

        result = concise.Completion.create(
            model='gpt-4',
            prompt=question,
            results=concise.Search.create(question, actualSearch=True),
            creative=False,
            detailed=True,
            codeContext='')

        return result.completion.choices[0].text

    except Exception as e:
        return 'An error occured, please make sure you are using a cf_clearance token and correct useragent | %s' % e


answer = phind_get_answer(prompt)
print(answer)

if '<title>Just a moment...</title>' not in answer:
    print("cf challenge success")
    sys.stdout.write(answer)
    sys.stdout.flush()
else:
    headers = {"user-agent":  concise.user_agent}
    cookies = {"cf_clearance": concise.cf_clearance}
    print("cf challenge failed trying to bypass")
    res = requests.get('https://nowsecure.nl',
                       headers=headers, cookies=cookies)
