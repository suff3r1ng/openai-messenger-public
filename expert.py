
import expert
import sys
import os
prompt = sys.stdin.readline()

if os.path.isfile('cf_clearance.txt'):
    # read the text from cf_clearance.txt
    with open('cf_clearance.txt', 'r') as f:
        expert.cf_clearance = f.read().strip()
else:
    expert.cf_clearance = ''

if os.path.isfile('user_agent.txt'):
    # read the text from cf_clearance.txt
    with open('user_agent.txt', 'r') as f:
        expert.user_agent = f.read().strip()
else:
    expert.user_agent = ''


def phind_get_answer(question: str) -> str:
    # set cf_clearance cookie
    try:

        result = expert.Completion.create(
            model='gpt-4',
            prompt=question,
            results=expert.Search.create(question, actualSearch=True),
            creative=False,
            detailed=True,
            codeContext='')

        return result.completion.choices[0].text

    except Exception as e:
        return 'An error occured, please make sure you are using a cf_clearance token and correct useragent | %s' % e


answer = phind_get_answer(prompt)


sys.stdout.write(answer)
sys.stdout.flush()
