// Fixed extractKeyMetrics method based on actual API response structure
  private extractKeyMetrics(data: any): KeyFinancialMetrics {
    // Handle the actual statistics API response format
    const stats = data?.statistics || data;
    const valuations = stats?.valuations_metrics || {};
    const financials = stats?.financials || {};
    const balanceSheet = financials?.balance_sheet || {};
    const incomeStatement = financials?.income_statement || {};
    
    // Calculate actual values from the API response
    const marketCap = valuations.market_capitalization || 0;
    const peRatio = valuations.trailing_pe || 0;
    const pegRatio = valuations.peg_ratio || 0;
    const priceToBook = valuations.price_to_book_mrq || 0;
    
    // Extract dividend yield from the correct location
    const dividendYield = stats?.dividends_and_splits?.trailing_annual_dividend_yield || 0;
    
    // Extract ROE from the correct location (convert from decimal to percentage)
    const roe = (financials.return_on_equity_ttm || 0) * 100;
    
    // Extract current ratio and debt to equity from balance sheet
    const currentRatio = balanceSheet.current_ratio_mrq || 0;
    const debtToEquity = balanceSheet.total_debt_to_equity_mrq || 0;
    
    return {
      marketCap: marketCap,
      peRatio: peRatio,
      pegRatio: pegRatio,
      priceToBook: priceToBook,
      dividendYield: dividendYield * 100, // Convert to percentage
      roe: roe,
      currentRatio: currentRatio,
      debtToEquity: debtToEquity
    };
  }

  // Fixed transformStatement to handle actual income statement format
  private transformIncomeStatement(statement: any): FinancialStatement {
    return {
      date: statement.fiscal_date,
      period: statement.quarter ? 'quarterly' : 'annual',
      revenue: statement.sales || 0,
      grossProfit: statement.gross_profit || 0,
      operatingIncome: statement.operating_income || 0,
      netIncome: statement.net_income || 0,
      eps: statement.eps_diluted || statement.eps_basic || 0,
      ebitda: statement.ebitda || 0,
      // Additional fields
      costOfRevenue: statement.cost_of_goods || 0,
      researchDevelopment: statement.operating_expense?.research_and_development || 0,
      sellingGeneralAdmin: statement.operating_expense?.selling_general_and_administrative || 0,
      incomeTax: statement.income_tax || 0,
      sharesOutstanding: statement.diluted_shares_outstanding || statement.basic_shares_outstanding || 0
    };
  }

  // Fixed transformBalanceSheet to handle actual balance sheet format
  private transformBalanceSheet(statement: any): FinancialStatement {
    const assets = statement.assets || {};
    const liabilities = statement.liabilities || {};
    const equity = statement.shareholders_equity || {};
    
    return {
      date: statement.fiscal_date,
      period: statement.quarter ? 'quarterly' : 'annual',
      // Assets
      totalAssets: assets.total_assets || 0,
      currentAssets: assets.current_assets?.total_current_assets || 0,
      cash: assets.current_assets?.cash_and_cash_equivalents || 0,
      inventory: assets.current_assets?.inventory || 0,
      accountsReceivable: assets.current_assets?.accounts_receivable || 0,
      // Liabilities
      totalLiabilities: liabilities.total_liabilities || 0,
      currentLiabilities: liabilities.current_liabilities?.total_current_liabilities || 0,
      longTermDebt: liabilities.non_current_liabilities?.long_term_debt || 0,
      // Equity
      totalEquity: equity.total_shareholders_equity || 0,
      retainedEarnings: equity.retained_earnings || 0,
      commonStock: equity.common_stock || 0
    };
  }

  // Fixed method to calculate proper metrics from financial data
  async calculateDerivedMetrics(
    symbol: string,
    fundamentals: Partial<FinancialData>,
    quote: any
  ): Promise<KeyFinancialMetrics> {
    const stats = await this.fetchStatistics(symbol);
    
    if (stats?.statistics) {
      // Use the extractKeyMetrics method to get proper values
      return this.extractKeyMetrics(stats);
    }
    
    // Fallback calculation if statistics endpoint fails
    const latestIncome = fundamentals.incomeStatement?.[0];
    const latestBalance = fundamentals.balanceSheet?.[0];
    
    if (!latestIncome || !latestBalance) {
      return this.getDefaultKeyMetrics();
    }
    
    // Calculate metrics from statements
    const totalEquity = latestBalance.totalEquity || 1; // Avoid division by zero
    const totalAssets = latestBalance.totalAssets || 1;
    const currentAssets = latestBalance.currentAssets || 0;
    const currentLiabilities = latestBalance.currentLiabilities || 0;
    const longTermDebt = latestBalance.longTermDebt || 0;
    const netIncome = latestIncome.netIncome || 0;
    const revenue = latestIncome.revenue || 0;
    const sharesOutstanding = latestIncome.sharesOutstanding || 1;
    
    // Current stock price from quote
    const currentPrice = parseFloat(quote?.close || '0');
    
    return {
      marketCap: currentPrice * sharesOutstanding,
      peRatio: latestIncome.eps ? currentPrice / latestIncome.eps : 0,
      pegRatio: 0, // Would need growth rate to calculate
      priceToBook: totalEquity > 0 ? (currentPrice * sharesOutstanding) / totalEquity : 0,
      dividendYield: 0, // Would need dividend data
      roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      debtToEquity: totalEquity > 0 ? longTermDebt / totalEquity : 0
    };
  }