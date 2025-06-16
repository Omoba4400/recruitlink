const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const sendVerificationCode = async (phoneNumber: string): Promise<{ success: boolean; status?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send verification code');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification code'
    };
  }
};

export const verifyCode = async (phoneNumber: string, code: string): Promise<{ success: boolean; valid?: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify code');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify code'
    };
  }
}; 