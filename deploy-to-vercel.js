// deploy-to-vercel.js
// Comprehensive deployment script for Vercel

const { execSync } = require('child_process');
const fs = require('fs');

class VercelDeployer {
  constructor() {
    this.requiredEnvVars = [
      'REACT_APP_TWELVE_DATA_API_KEY',
      'REACT_APP_SUPABASE_URL', 
      'REACT_APP_SUPABASE_ANON_KEY'
    ];
  }

  async deploy() {
    console.log('🚀 VERCEL DEPLOYMENT PROCESS\n');
    
    // Step 1: Check environment variables
    this.checkEnvironmentVariables();
    
    // Step 2: Build the project
    await this.buildProject();
    
    // Step 3: Deploy without environment variable references
    await this.deployWithoutSecrets();
    
    // Step 4: Test deployment
    await this.testDeployment();
  }

  checkEnvironmentVariables() {
    console.log('1️⃣ Checking Environment Variables...');
    
    // Read .env file
    let envVars = {};
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
    } catch (error) {
      console.log('⚠️ No .env file found');
    }

    console.log('📋 Environment Variables Status:');
    this.requiredEnvVars.forEach(varName => {
      const hasValue = envVars[varName] && envVars[varName] !== 'your-api-key-here' && envVars[varName] !== 'your-supabase-url';
      const status = hasValue ? '✅' : '❌';
      console.log(`${status} ${varName}: ${hasValue ? 'Set' : 'Missing/Default'}`);
    });
    
    console.log('\n💡 To set environment variables in Vercel:');
    console.log('1. Go to: https://vercel.com/apex-2b9a18e9/trisight/settings/environment-variables');
    console.log('2. Add the required variables');
    console.log('3. Redeploy the application');
    console.log('');
  }

  async buildProject() {
    console.log('2️⃣ Building Project...');
    try {
      console.log('📦 Running build command...');
      execSync('npm run vercel:build', { stdio: 'inherit' });
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.log('❌ Build failed:', error.message);
      throw error;
    }
    console.log('');
  }

  async deployWithoutSecrets() {
    console.log('3️⃣ Deploying to Vercel...');
    
    // Create a temporary vercel.json without secret references
    const originalVercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const tempVercelConfig = { ...originalVercelConfig };
    
    // Remove environment variable references that cause deployment to fail
    delete tempVercelConfig.env;
    
    // Write temporary config
    fs.writeFileSync('vercel.temp.json', JSON.stringify(tempVercelConfig, null, 2));
    
    try {
      console.log('📤 Deploying with temporary configuration...');
      
      // Deploy using the temporary config
      const deployCommand = 'vercel --prod --yes --local-config vercel.temp.json';
      const output = execSync(deployCommand, { encoding: 'utf8' });
      
      console.log('✅ Deployment completed');
      console.log('Output:', output);
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.deploymentUrl = urlMatch[0];
        console.log(`🌐 Deployment URL: ${this.deploymentUrl}`);
      }
      
    } catch (error) {
      console.log('❌ Deployment failed:', error.message);
      throw error;
    } finally {
      // Clean up temporary file
      if (fs.existsSync('vercel.temp.json')) {
        fs.unlinkSync('vercel.temp.json');
      }
    }
    console.log('');
  }

  async testDeployment() {
    console.log('4️⃣ Testing Deployment...');
    
    if (!this.deploymentUrl) {
      console.log('⚠️ No deployment URL available for testing');
      return;
    }

    const axios = require('axios');
    
    // Test frontend
    try {
      const frontendResponse = await axios.get(this.deploymentUrl, { timeout: 15000 });
      if (frontendResponse.status === 200) {
        console.log('✅ Frontend accessible');
      }
    } catch (error) {
      console.log('❌ Frontend test failed:', error.message);
    }

    // Test API health endpoint
    try {
      const healthResponse = await axios.get(`${this.deploymentUrl}/api/health`, { 
        timeout: 15000,
        validateStatus: () => true 
      });
      console.log(`API Health Status: ${healthResponse.status}`);
      if (healthResponse.status === 200) {
        console.log('✅ API health endpoint working');
        console.log('Response:', healthResponse.data);
      } else {
        console.log('⚠️ API health endpoint issues');
      }
    } catch (error) {
      console.log('❌ API health test failed:', error.message);
    }

    // Test report generation endpoint
    try {
      const reportResponse = await axios.post(`${this.deploymentUrl}/api/reports/generate`, {
        ticker: 'AAPL',
        title: 'Deployment Test',
        template: 'equity-research'
      }, { 
        timeout: 30000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Report Generation Status: ${reportResponse.status}`);
      if (reportResponse.status === 200) {
        console.log('✅ Report generation endpoint working');
      } else if (reportResponse.status === 500) {
        console.log('⚠️ Report generation has server errors (likely missing env vars)');
      } else {
        console.log('⚠️ Report generation endpoint issues');
      }
    } catch (error) {
      console.log('❌ Report generation test failed:', error.message);
    }

    console.log('');
    console.log('🎯 DEPLOYMENT SUMMARY:');
    console.log(`📍 URL: ${this.deploymentUrl}`);
    console.log('📋 Next Steps:');
    console.log('1. Set up environment variables in Vercel dashboard');
    console.log('2. Test report generation functionality');
    console.log('3. Monitor application performance');
  }
}

// Run deployment
const deployer = new VercelDeployer();
deployer.deploy().catch(error => {
  console.error('❌ Deployment process failed:', error);
  process.exit(1);
});
