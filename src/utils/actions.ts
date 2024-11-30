import { ActionFunction, data, redirect } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { isEmail, validateLoginForm, validateRegisterForm } from './validation';
import { findUsersBy, register } from './api';
import { RegisterForm, LoginForm } from '../pages';

export interface ActionData<T extends object> {
  totalError?: string;
  inputErrors?: Partial<T>;
}

export type LoginActionData = ActionData<LoginForm>;
export type RegisterActionData = ActionData<RegisterForm>;

export const loginAction: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const form: LoginForm = {
    usernameOrEmail: formData.get('usernameOrEmail') as string,
    password: formData.get('password') as string,
  };

  const errors = validateLoginForm(form);

  if (errors) {
    return data<LoginActionData>({ inputErrors: errors }, { status: 400 });
  }

  const params = isEmail(form.usernameOrEmail)
    ? { email: form.usernameOrEmail }
    : { username: form.usernameOrEmail };

  try {
    const users = await findUsersBy(params);

    if (!users.length) {
      return data<LoginActionData>(
        {
          inputErrors: {
            usernameOrEmail: 'There is no such user. Please try again',
          },
        },
        { status: 400 }
      );
    }

    if (users[0].password != form.password) {
      return data<LoginActionData>(
        { inputErrors: { password: 'Invalid password. Please try again' } },
        { status: 400 }
      );
    }

    return redirect('/');
  } catch {
    return data<LoginActionData>(
      { totalError: 'Failed to connect to server' },
      { status: 400 }
    );
  }
};

export const registerAction: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const form: RegisterForm = {
    username: formData.get('username') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirm: formData.get('confirm') as string,
  };

  const errors = validateRegisterForm(form);

  if (errors) {
    return data<RegisterActionData>({ inputErrors: errors }, { status: 400 });
  }

  try {
    await register({
      id: uuidv4(),
      username: form.username as string,
      email: form.email as string,
      password: form.password as string,
      createdAt: Date.now(),
    });

    return redirect('/');
  } catch (error) {
    if (error instanceof Error) {
      return data<LoginActionData>(
        { totalError: 'Failed to connect to server' },
        { status: 400 }
      );
    }

    return error;
  }
};