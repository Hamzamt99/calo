import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: number;
}

export const validateToken = (token: string): { is_valid: boolean; id?: number } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return {
      is_valid: true,
      id: decoded.id,
    };
  } catch (err) {
    return {
      is_valid: false,
    };
  }
};
