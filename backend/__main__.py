from . import run_server, run_dev_server
import os

PRODUCTION = os.getenv("PRODUCTION")

if __name__ == "__main__":
    if PRODUCTION:
        run_server()
    else:
        run_dev_server()
