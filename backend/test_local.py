import sys
import main
import json
import base64
import hmac
import hashlib

def test_cache_key():
    cart1 = {"cart_value": 1500, "product_categories": ["shoes", "shirts"], "abandonment_step": "cart"}
    cart2 = {"cart_value": 2000, "product_categories": ["shirts", "shoes"], "abandonment_step": "cart"}
    
    key1 = main.compute_cache_key(cart1)
    key2 = main.compute_cache_key(cart2)
    
    assert key1 == key2, "Cache key should be independent of category order and same bucket"
    print("Cache key test passed!")

def test_hmac():
    main.SHOPIFY_WEBHOOK_SECRET = "secret_key"
    payload = b'{"hello": "world"}'
    
    digest = hmac.new(
        "secret_key".encode('utf-8'),
        payload,
        digestmod=hashlib.sha256
    ).digest()
    valid_hmac = base64.b64encode(digest).decode('utf-8')
    
    assert main.verify_shopify_webhook(payload, valid_hmac) == True, "HMAC should be valid"
    assert main.verify_shopify_webhook(payload, "invalid_hmac") == False, "HMAC should be invalid"
    print("HMAC test passed!")

if __name__ == "__main__":
    test_cache_key()
    test_hmac()
