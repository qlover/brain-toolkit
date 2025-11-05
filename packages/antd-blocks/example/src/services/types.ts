/**
 * User data type definition
 *
 * Represents a user entity in the system
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: number;

  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's role in the system
   */
  role: 'admin' | 'user' | 'guest';

  /**
   * User's age
   */
  age?: number;

  /**
   * User's phone number
   */
  phone?: string;
}
