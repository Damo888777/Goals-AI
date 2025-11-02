#!/usr/bin/env python3
"""Patch expo-apple-authentication for iOS 18+ compatibility"""

file_path = "node_modules/expo-apple-authentication/ios/AppleAuthenticationExceptions.swift"

try:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if already patched
    if '@unknown default:' in content:
        print("✅ Already patched")
        exit(0)
    
    # Add @unknown default case before the closing brace of the switch
    old_code = """  case .notInteractive:
    return RequestNotInteractiveException()
  }
}"""
    
    new_code = """  case .notInteractive:
    return RequestNotInteractiveException()
  @unknown default:
    return RequestUnknownException()
  }
}"""
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        with open(file_path, 'w') as f:
            f.write(content)
        print("✅ Successfully patched expo-apple-authentication")
    else:
        print("⚠️  Pattern not found - file may have changed")
        exit(1)
        
except FileNotFoundError:
    print(f"⚠️  File not found: {file_path}")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
