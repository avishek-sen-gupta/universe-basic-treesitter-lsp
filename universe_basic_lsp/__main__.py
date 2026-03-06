"""Entry point for the UniVerse BASIC Language Server."""

import argparse
import logging

from .server import server


def main():
    parser = argparse.ArgumentParser(description="UniVerse BASIC Language Server")
    parser.add_argument("--tcp", action="store_true", help="Use TCP transport")
    parser.add_argument("--host", default="127.0.0.1", help="TCP host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=2087, help="TCP port (default: 2087)")
    parser.add_argument("--log", default="warning", help="Log level")
    args = parser.parse_args()

    logging.basicConfig(level=getattr(logging, args.log.upper(), logging.WARNING))

    if args.tcp:
        server.start_tcp(args.host, args.port)
    else:
        server.start_io()


if __name__ == "__main__":
    main()
