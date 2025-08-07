// src/components/Reports/PDFTemplates/MinimalPDFTest.tsx
// Minimal PDF test to isolate the hasOwnProperty error

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
  },
});

interface MinimalPDFTestProps {
  ticker: string;
  data?: any;
}

export const MinimalPDFTest: React.FC<MinimalPDFTestProps> = ({ ticker, data }) => {
  console.log('📄 MinimalPDFTest rendering with:', { ticker, data });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Test PDF Report</Text>
        <Text style={styles.text}>Ticker: {ticker}</Text>
        <Text style={styles.text}>Generated: {new Date().toLocaleDateString()}</Text>
        <Text style={styles.text}>This is a minimal test PDF to isolate the hasOwnProperty error.</Text>
        
        {data && (
          <View>
            <Text style={styles.text}>Data received: {typeof data}</Text>
            <Text style={styles.text}>Data keys: {Object.keys(data || {}).join(', ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
