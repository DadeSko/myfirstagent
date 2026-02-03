# Troubleshooting Guide

## 🚨 Troubleshooting Guide

A comprehensive guide for diagnosing and solving common problems in our development environment.

## 🎯 Troubleshooting Methodology

### Systematic Approach (5W + H)

1. **What** - What is happening?
2. **When** - When does the problem occur?
3. **Where** - Where does it manifest?
4. **Who** - Who is involved/who can help?
5. **Why** - Why is it happening?
6. **How** - How can we fix it?

## 🔧 Common Problems and Solutions

### 1. Installation and Dependency Problems

#### Symptoms
```bash
# Typical errors:
npm ERR! Cannot resolve dependency
Module not found: Error: Can't resolve 'package-name'
npm WARN peer dep missing
```

#### Diagnosis
```bash
# Check package.json
read_file("package.json")

# Verify installations
bash("npm ls")

# Check Node/npm versions
bash("node --version")
bash("npm --version")

# Verify npm cache
bash("npm cache verify")
```

#### Solutions
```bash
# Clean and reinstall
bash("rm -rf node_modules package-lock.json")
bash("npm cache clean --force")
bash("npm install")

# Update npm
bash("npm install -g npm@latest")

# Resolve peer dependency conflicts
bash("npm install --legacy-peer-deps")
```

### 2. Build and Compilation Problems

#### Symptoms
```bash
# Typical errors:
Syntax Error: Unexpected token
Module build failed
Cannot find module
```

#### Diagnosis
```bash
# Find configuration files
code_search("webpack|babel|tsconfig")

# Check build configuration
read_file("webpack.config.js")
read_file("babel.config.js")
read_file("tsconfig.json")

# Verify npm scripts
bash("npm run build -- --verbose")
```

#### Solutions
```bash
# Clean previous build
bash("npm run clean")
bash("rm -rf build/ dist/")

# Build with debug
bash("NODE_ENV=development npm run build")

# Check specific file syntax
bash("node -c suspicious-file.js")
```

### 3. Runtime Problems

#### Symptoms
```bash
# Typical errors:
ReferenceError: variable is not defined
TypeError: Cannot read property 'x' of undefined
Promise rejection unhandled
```

#### Diagnosis
```bash
# Find specific error
code_search("error message text")

# Check console logs
code_search("console\\.log|console\\.error")

# Verify async/await usage
code_search("async|await")

# Check error handling
code_search("try|catch|throw")
```

#### Solutions
```bash
# Add detailed logging
edit_file(
  path="problematic-file.js",
  old_str="function problematicFunction() {",
  new_str="function problematicFunction() {\n  console.log('🔍 Debugging:', arguments);"
)

# Test in isolation
bash("node -e \"require('./problematic-file.js')\"")
```

### 4. Network and API Problems

#### Symptoms
```bash
# Typical errors:
ECONNREFUSED
CORS error
Timeout
504 Gateway Timeout
```

#### Diagnosis
```bash
# Test connectivity
bash("ping api-server.com")
bash("curl -I http://localhost:3000/api/health")

# Check ports in use
bash("netstat -tulpn | grep :3000")

# Verify environment variables
bash("env | grep -i api")

# Find API configurations
code_search("baseURL|apiUrl|endpoint")
```

#### Solutions
```bash
# Test endpoint manually
bash("curl -v http://localhost:3000/api/test")

# Check CORS settings
code_search("cors|Access-Control")

# Verify proxy settings
read_file("package.json") # "proxy" section
```

### 5. Testing Problems

#### Symptoms
```bash
# Typical errors:
Test suite failed to run
Cannot find module in test
Timeout in test
```

#### Diagnosis
```bash
# Find test configuration
read_file("jest.config.js")
read_file("package.json") # "jest" section

# Check test setup
code_search("setupTests|test setup")

# Verify mocks
code_search("jest\\.mock|__mocks__")
```

#### Solutions
```bash
# Run specific tests
bash("npm test -- --testNamePattern=\"test name\"")

# Debug test
bash("npm test -- --detectOpenHandles --forceExit")

# Clean Jest cache
bash("npm test -- --clearCache")
```

## 🔍 Advanced Debug Strategies

### Debug with Strategic Logging

```javascript
// Effective logging template
const debugLog = (label, data) => {
  console.log(`🔍 ${label}:`, JSON.stringify(data, null, 2));
};

// At critical points:
debugLog('Function Input', { param1, param2 });
debugLog('Before API Call', { url, payload });
debugLog('API Response', response.data);
debugLog('Function Output', result);
```

### Performance Analysis

```bash
# Memory profiling
bash("node --inspect --max-old-space-size=4096 app.js")

# Bundle size analysis
bash("npm run build -- --analyze")

# Resource monitoring
bash("top -p $(pgrep node)")
```

### Network Debug

```bash
# Traffic sniffing
bash("tcpdump -i lo0 port 3000")

# HTTP request analysis
bash("curl -w \"@curl-format.txt\" -o /dev/null -s http://localhost:3000")
```

## 🛠️ Emergency Toolkit

### Quick Recovery Commands

```bash
# Complete dependency reset
emergency_deps_reset() {
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
}

# Git reset (caution!)
emergency_git_reset() {
  git stash
  git reset --hard HEAD
  git clean -fd
}

# Backup important configurations
backup_configs() {
  cp package.json package.json.backup
  cp .env .env.backup
  cp -r config/ config.backup/
}
```

### Quick Health Check

```bash
# System verification script
system_health_check() {
  echo "📊 System Health Check"
  echo "Node version: $(node --version)"
  echo "NPM version: $(npm --version)"
  echo "Git status: $(git status --porcelain | wc -l) modified files"
  echo "Disk space: $(df -h . | tail -1 | awk '{print $4}') available"
  echo "Memory: $(free -h | grep '^Mem:' | awk '{print $7}') available"
}
```

## 📋 Troubleshooting Checklist

### Pre-Debug Checklist
- [ ] Problem reproducible?
- [ ] Complete error messages collected?
- [ ] Last change identified?
- [ ] Environment verified (dev/staging/prod)?
- [ ] Dependencies recently updated?

### During Debug
- [ ] Hypothesis formulated?
- [ ] Test case created?
- [ ] Logging added at critical points?
- [ ] Environment variables verified?
- [ ] Documentation consulted?

### Post-Fix Checklist
- [ ] Fix tested in isolation?
- [ ] Regressions verified?
- [ ] Debug logging removed?
- [ ] Documentation updated?
- [ ] Team informed of fix?

## 🚀 Complete Troubleshooting Examples

### Example 1: App Won't Start

```bash
# 1. Initial diagnosis
bash("npm start 2>&1 | head -20")

# 2. Verify port
bash("lsof -i :3000")

# 3. Check configuration
read_file("package.json")

# 4. Test start script
bash("node src/index.js")

# 5. Solution: port occupied
bash("kill $(lsof -ti:3000)")
bash("npm start")
```

### Example 2: Failing Tests

```bash
# 1. Run tests with verbose
bash("npm test -- --verbose")

# 2. Identify failing test
code_search("describe.*failing test")

# 3. Read test file
read_file("tests/failing-test.spec.js")

# 4. Check mocks
code_search("jest\\.mock", path="tests/")

# 5. Debug specific test
bash("npm test -- --testNamePattern=\"specific test\"")
```

### Example 3: Slow Build

```bash
# 1. Analyze build time
bash("time npm run build")

# 2. Check webpack config
read_file("webpack.config.js")

# 3. Analyze bundle
bash("npm run build -- --analyze")

# 4. Identify bottlenecks
code_search("import.*node_modules")

# 5. Optimize imports
# Replace full imports with specific imports
```

## 📚 Resources and References

### Recommended Debug Tools

- **Chrome DevTools**: Frontend debug
- **Node.js Inspector**: Backend debug
- **React DevTools**: Debug React apps
- **Redux DevTools**: Debug state management
- **Lighthouse**: Performance analysis

### Command Line Utilities

```bash
# Process monitoring
htop
ps aux | grep node

# Network analysis
netstat -an | grep LISTEN
ss -tulpn

# File system
du -sh * | sort -hr
find . -name "*.log" -size +100M
```

### Log Analysis

```bash
# Useful grep patterns
grep -r "ERROR" logs/
tail -f logs/app.log | grep -i error
awk '/ERROR/{print $0}' logs/app.log

# JSON log parsing
cat logs/app.log | jq '.level' | sort | uniq -c
```

## 🏆 Best Practices

### Prevention

1. **Proactive monitoring**
2. **Automated testing**
3. **Rigorous code reviews**
4. **Updated documentation**
5. **Regular backups**

### During Debug

1. **Document the process**
2. **Test one thing at a time**
3. **Use versioning for rollback**
4. **Involve the team when necessary**
5. **Don't make random fixes**

### Post-Resolution

1. **Create tests to prevent regressions**
2. **Update documentation**
3. **Share the solution**
4. **Reflect on what caused the problem**
5. **Improve processes for future prevention**
