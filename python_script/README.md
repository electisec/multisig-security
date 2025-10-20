# 🎯 **Usage Examples**

## **Quick Start**
```bash
# Extract all Ethereum Safes
python3 safe_extractor.py --chain ethereum --output ethereum-safes.txt

# Find valuable Arbitrum Safes (>$10K)
python3 safe_extractor.py --chain arbitrum --min-value 10000 --output whale-safes.txt

# Test extraction works
python3 safe_extractor.py --chain ethereum --test
```

## **Run Tests**
```bash
python3 test_safe_extraction.py
```
