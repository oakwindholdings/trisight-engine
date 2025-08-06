const axios = require('axios');
const fs = require('fs');

async function testComprehensiveReportAPI() {
    console.log('🧪 Testing Comprehensive Report Generation API...\n');
    
    const apiUrl = 'http://localhost:3001/api/reports/generate-comprehensive';
    const requestPayload = {
        ticker: "NVDA",
        title: "NVIDIA Corporation Comprehensive Analysis",
        outputFormat: "pdf"
    };

    try {
        console.log('📤 Making POST request to:', apiUrl);
        console.log('📋 Request payload:', JSON.stringify(requestPayload, null, 2));
        
        const startTime = Date.now();
        const response = await axios.post(apiUrl, requestPayload, {
            timeout: 120000, // 2 minute timeout
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log('\n✅ API Response received successfully!');
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Headers:', JSON.stringify(response.headers, null, 2));
        
        // Log the response structure
        console.log('\n📄 Response Structure:');
        console.log('- Success:', response.data.success);
        console.log('- Message:', response.data.message);
        console.log('- Report ID:', response.data.reportId);
        console.log('- PDF File:', response.data.pdfFile);
        console.log('- Generated At:', response.data.generatedAt);
        
        // Check if data sections exist
        if (response.data.data) {
            console.log('\n📊 Data Sections Available:');
            const sections = Object.keys(response.data.data);
            sections.forEach((section, index) => {
                console.log(`  ${index + 1}. ${section}`);
            });
        }
        
        // Check if PDF was generated
        if (response.data.pdfFile) {
            const pdfPath = `generated-reports/${response.data.pdfFile}`;
            const fullPdfPath = `C:\\Users\\bobstewart\\dev\\projects\\emerald\\trisight\\${pdfPath}`;
            
            console.log('\n📁 Checking generated PDF...');
            console.log('Expected PDF path:', fullPdfPath);
            
            try {
                const stats = fs.statSync(fullPdfPath);
                console.log('✅ PDF file exists!');
                console.log('📏 File size:', (stats.size / 1024).toFixed(2) + ' KB');
                console.log('📅 Created:', stats.birthtime.toISOString());
            } catch (fileError) {
                console.log('❌ PDF file not found at expected location');
                
                // Try alternative locations
                const altPaths = [
                    `C:\\Users\\bobstewart\\dev\\projects\\emerald\\trisight\\server\\generated-reports\\${response.data.pdfFile}`,
                    `C:\\Users\\bobstewart\\dev\\projects\\emerald\\trisight\\generated-reports\\${response.data.pdfFile}`
                ];
                
                for (const altPath of altPaths) {
                    try {
                        const altStats = fs.statSync(altPath);
                        console.log('✅ Found PDF at:', altPath);
                        console.log('📏 File size:', (altStats.size / 1024).toFixed(2) + ' KB');
                        break;
                    } catch (e) {
                        console.log('❌ Not found at:', altPath);
                    }
                }
            }
        }
        
        // Save full response to file for analysis
        const responseFile = 'test-comprehensive-response.json';
        fs.writeFileSync(responseFile, JSON.stringify(response.data, null, 2));
        console.log(`\n💾 Full response saved to: ${responseFile}`);
        
        return {
            success: true,
            response: response.data,
            duration,
            status: response.status
        };
        
    } catch (error) {
        console.log('\n❌ API Request failed!');
        console.log('Error type:', error.constructor.name);
        
        if (error.response) {
            console.log('📊 Response Status:', error.response.status);
            console.log('📋 Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('📡 No response received');
            console.log('Request details:', error.request);
        } else {
            console.log('⚙️  Request setup error:', error.message);
        }
        
        // Save error details
        const errorDetails = {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
            stack: error.stack
        };
        
        fs.writeFileSync('test-comprehensive-error.json', JSON.stringify(errorDetails, null, 2));
        console.log('💾 Error details saved to: test-comprehensive-error.json');
        
        return {
            success: false,
            error: errorDetails
        };
    }
}

// Run the test
testComprehensiveReportAPI()
    .then(result => {
        console.log('\n🏁 Test completed!');
        console.log('Result:', result.success ? '✅ Success' : '❌ Failed');
        process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
        console.error('💥 Unexpected error:', err);
        process.exit(1);
    });