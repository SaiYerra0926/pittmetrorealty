/**
 * Email API Client
 * Handles sending inquiry emails for Sell and Buy pages
 */

// Use the same base URL pattern as other APIs
// Match the pattern used in properties.ts and reviews.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://3.12.102.126:3001/api';

export interface SellInquiryData {  
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone' | 'text';
  description: string;
}

export interface BuyInquiryData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  budget: string;
  timeline: string;
  preferredAreas: string;
  firstTimeBuyer: boolean;
  additionalInfo: string;
}

class EmailAPI {
  private async fetchData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;
    
    console.log(`📧 Email API: Sending request to ${url}`);
    console.log(`📧 Email API: Method: POST (forced)`);
    console.log(`📧 Email API: Body:`, options.body);
    
    // Build options object - ensure method is POST
    const requestOptions: RequestInit = {
      method: 'POST', // Always POST for email endpoints
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body,
      // Include any other options but don't let them override method
      ...Object.fromEntries(
        Object.entries(options).filter(([key]) => key !== 'method')
      ),
    };
    
    // Explicitly set method to POST (cannot be overridden)
    requestOptions.method = 'POST';

    try {
      const response = await fetch(url, requestOptions);
      
      console.log(`📧 Email API: Response status ${response.status} for ${url}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
          error: `HTTP error! status: ${response.status}`
        }));
        console.error(`📧 Email API Error:`, errorData);
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📧 Email API: Success response:`, data);
      return data as T;
    } catch (error: any) {
      console.error(`📧 Error in email API ${endpoint}:`, error);
      console.error(`📧 Full error:`, {
        message: error.message,
        stack: error.stack,
        url: url
      });
      throw error;
    }
  }

  /**
   * Send sell inquiry email
   */
  async sendSellInquiry(data: SellInquiryData): Promise<{ success: boolean; message: string }> {
    return this.fetchData<{ success: boolean; message: string }>('/email/sell-inquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Send buy inquiry email
   */
  async sendBuyInquiry(data: BuyInquiryData): Promise<{ success: boolean; message: string }> {
    return this.fetchData<{ success: boolean; message: string }>('/email/buy-inquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const emailAPI = new EmailAPI();
export default EmailAPI;

