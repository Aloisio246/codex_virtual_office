#!/usr/bin/env python3
"""Envia um evento local: python trigger.py coding 'Escrevendo testes'."""
import argparse
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def main():
    parser = argparse.ArgumentParser(description="Atualiza o Codex Virtual Office")
    parser.add_argument("status", choices=("coding", "idle"))
    parser.add_argument("message", help="Texto exibido no feed")
    args = parser.parse_args()

    payload = json.dumps({"agent_id": "codex", "status": args.status,
                          "message": args.message}).encode("utf-8")
    request = Request("http://localhost:3000/api/event", data=payload,
                      headers={"Content-Type": "application/json; charset=utf-8"},
                      method="POST")
    try:
        with urlopen(request, timeout=5) as response:
            print(response.read().decode("utf-8"))
    except (HTTPError, URLError) as error:
        print(f"Falha ao enviar evento: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
