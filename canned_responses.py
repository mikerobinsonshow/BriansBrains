import re
import time

from pathlib import Path

# Path to the source file referenced in responses
S1_PATH = Path("docs/Tod_Opinions.txt")

# Predefined responses
RESPONSES = [
    (
        lambda q: re.search(r"\btabs?\b", q, re.IGNORECASE) and re.search(r"green screen", q, re.IGNORECASE),
        "I space differently than most Developers and prefer using spaces for indentation. I align my code by adding three spaces, which makes the code visually aligned with the prior row on a green screen display. Tabbing is not preferred because it introduces special control characters that can disrupt alignment when viewed in different environments like RDi or Green Screen. Does that help? [S1]\nS1: {path} | S1".format(path=S1_PATH)
    ),
    (
        lambda q: re.search(r"\bNYCM\b", q, re.IGNORECASE) and re.search(r"founded", q, re.IGNORECASE),
        "NYCM Insurance was founded in the year [S1] and again as per our context, which is consistent with historical records. Does that help?[S1]\n--- CONTEXT: NYCM Insurance is an established property and casualty insurance company based out of central New York, with its roots tracing back over 120 years since it was founded by VanNess DeMar Robinson [S1]. The organization boasts a substantial workforce comprising more than 800 dedicated employees.\nS1: {path}".format(path=S1_PATH)
    )
]

def get_response(question: str) -> str:
    """Return a canned response for a given question."""
    for condition, response in RESPONSES:
        if condition(question):
            return response
    return "I'm not sure. Could you ask another question?"



def think_and_get_response(question: str, delay: float = 0) -> str:
    """Simulate an optional thinking delay before returning the final answer."""
    print("Hmmm, good question. Let me think about that...")
    if delay > 0:
        time.sleep(delay)
    return get_response(question)

if __name__ == "__main__":
    import sys
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else input("Question: ")
    print(think_and_get_response(query))
