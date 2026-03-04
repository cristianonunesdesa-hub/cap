import React, { useState } from 'react';
import { Customer } from '../types';
import { supabase } from '../services/supabase';
import { Lock, Shield, Eye, EyeOff, Check, AlertTriangle } from './Icons';

interface LoginScreenProps {
    onLogin: (data: Customer[], password: string) => void;
    isFirstAccess: boolean;
}

type ScreenState = 'login' | 'register';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [screenState, setScreenState] = useState<ScreenState>('login');

    // Inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Visual States
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else if (data.user) {
                // Sucesso! Passamos vazio por enquanto, pois os dados serão do Supabase
                onLogin([], password);
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else if (data.user) {
                setMessage('Conta criada! Verifique seu e-mail para confirmar a validação.');
            }
        } catch (err) {
            setError('Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    const togglePass = () => setShowPassword(!showPassword);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-2xl">

                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-4 rounded-full">
                        {screenState === 'login' ? <Lock className="w-8 h-8 text-blue-600" /> : <Shield className="w-8 h-8 text-blue-600" />}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
                    {screenState === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="text-center text-gray-500 mb-6 text-sm">
                    {screenState === 'login' ? 'Entre com seu e-mail para gerenciar sua carteira.' : 'Cadastre-se para começar a usar o sistema gratuitamente.'}
                </p>

                <form onSubmit={screenState === 'login' ? handleLogin : handleRegister}>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>

                    <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="******"
                                required
                            />
                            <button type="button" onClick={togglePass} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {screenState === 'register' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="******"
                                required
                            />
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md flex items-center">
                            <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processando...' : (screenState === 'login' ? 'Entrar' : 'Registrar e Validar E-mail')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    {screenState === 'login' ? (
                        <p className="text-sm text-gray-600">
                            Não tem uma conta?{' '}
                            <button
                                onClick={() => setScreenState('register')}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Cadastre-se grátis
                            </button>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <button
                                onClick={() => setScreenState('login')}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Voltar para Login
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;