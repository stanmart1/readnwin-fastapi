class ApiClient {
  private static instance: ApiClient;
  private baseURL: string;
  private token: string | null = null;

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getHeaders(isFormData = false): HeadersInit {
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        this.token = token;
      }
    }
    
    return headers;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  public async getPaymentGateways() {
    return this.request('/payment/gateways');
  }

  public async createFlutterwavePayment(paymentData: any) {
    return this.request('/flutterwave/inline', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  public async getBankTransferDetails(transferId: string) {
    return this.request(`/bank-transfer/${transferId}`);
  }

  public async uploadProofOfPayment(orderId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/bank-transfer/upload-proof/${orderId}`, {
      method: 'POST',
      body: formData
    });
  }

  public async getUserOrders() {
    return this.request('/orders/user');
  }
}

export const apiClient = ApiClient.getInstance();