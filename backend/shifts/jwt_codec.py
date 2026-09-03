"""JWT (HS256) feito à mão — espelha auth-service/.../security/JwtCodec.java."""
import base64
import hashlib
import hmac
import json
import time


class JwtError(Exception):
    """Token ausente, malformado, com assinatura inválida ou expirado."""


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def _sign(signing_input: str, secret: bytes) -> bytes:
    return hmac.new(secret, signing_input.encode("utf-8"), hashlib.sha256).digest()


def encode(claims: dict, secret: str) -> str:
    """Usado só em testes; em produção quem emite o token é o auth-service."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_segment = _b64url_encode(json.dumps(header).encode("utf-8"))
    payload_segment = _b64url_encode(json.dumps(claims).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}"
    signature = _b64url_encode(_sign(signing_input, secret.encode("utf-8")))
    return f"{signing_input}.{signature}"


def decode_and_verify(token: str, secret: str) -> dict:
    if not token or token.count(".") != 2:
        raise JwtError("Token com formato inválido.")

    header_segment, payload_segment, signature_segment = token.split(".")
    signing_input = f"{header_segment}.{payload_segment}"

    expected_signature = _sign(signing_input, secret.encode("utf-8"))
    try:
        actual_signature = _b64url_decode(signature_segment)
    except Exception:
        raise JwtError("Assinatura do token inválida.")

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise JwtError("Assinatura do token inválida.")

    try:
        claims = json.loads(_b64url_decode(payload_segment))
    except Exception:
        raise JwtError("Payload do token inválido.")

    exp = claims.get("exp")
    if exp is None or exp < time.time():
        raise JwtError("Token expirado.")

    return claims
