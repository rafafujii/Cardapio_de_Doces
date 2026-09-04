import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Sparkles,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { 
  cleanPhoneDigits, 
  formatBrazilianPhone, 
  isValidBrazilianMobilePhone, 
  createAndSendVerificationCode, 
  verifyOtpCode, 
  savePhoneVerifiedFirestore,
  checkPhoneFirestoreVerified,
  isPhoneLocallyVerified
} from '../lib/phoneVerificationHelper';

interface PhoneVerificationCardProps {
  phone: string;
  customerName: string;
  onPhoneChange: (formattedPhone: string) => void;
  isVerified: boolean;
  onVerified: (verifiedPhone: string) => void;
  storeContactPhone: string;
  error?: string;
  onClearError?: () => void;
  enabled?: boolean;
}

export const PhoneVerificationCard: React.FC<PhoneVerificationCardProps> = ({
  phone,
  customerName,
  onPhoneChange,
  isVerified,
  onVerified,
  storeContactPhone,
  error,
  onClearError,
  enabled = true
}) => {
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanDigits = cleanPhoneDigits(phone);
  const isValidFormat = isValidBrazilianMobilePhone(phone);

  // Automatically check if the current phone is already verified in local storage or Firestore
  useEffect(() => {
    if (!enabled || !cleanDigits || cleanDigits.length < 10) return;

    // Fast check: local storage
    if (isPhoneLocallyVerified(cleanDigits)) {
      if (!isVerified) {
        onVerified(cleanDigits);
      }
      return;
    }

    // Secondary check: Firestore verified_phones
    let isMounted = true;
    checkPhoneFirestoreVerified(db, cleanDigits).then((verified) => {
      if (isMounted && verified && !isVerified) {
        onVerified(cleanDigits);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cleanDigits, enabled, isVerified, onVerified]);

  // Handle countdown timer for resending code
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [cooldownSeconds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatBrazilianPhone(raw);
    onPhoneChange(formatted);
    if (onClearError) onClearError();

    // Reset verification states if phone changes
    if (cleanPhoneDigits(raw) !== cleanDigits) {
      setCodeSent(false);
      setVerificationCodeInput('');
      setFeedback(null);
      setLastGeneratedCode(null);
    }
  };

  const handleSendCode = async () => {
    if (!cleanDigits) {
      setFeedback({ text: 'Por favor, digite seu número de WhatsApp com DDD.', isError: true });
      return;
    }

    if (!isValidFormat) {
      setFeedback({ text: 'Digite um número de celular válido com DDD (ex: 11 99999-9999).', isError: true });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const res = await createAndSendVerificationCode(
        db,
        cleanDigits,
        customerName || 'Cliente',
        storeContactPhone
      );

      setLastGeneratedCode(res.code);
      setWhatsappDirectUrl(res.whatsappDirectUrl);
      setCodeSent(true);
      setCooldownSeconds(60);
      setFeedback({
        text: `Código de 6 dígitos gerado para ${res.formattedPhone}! Envie a confirmação no WhatsApp ou digite o código abaixo.`,
        isError: false
      });
    } catch (err: any) {
      console.error("Error generating verification code:", err);
      setFeedback({
        text: 'Não foi possível gerar o código agora. Tente novamente em instantes.',
        isError: true
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = verificationCodeInput.replace(/\D/g, '').trim();

    if (!cleanCode || cleanCode.length < 4) {
      setFeedback({ text: 'Digite o código de 6 dígitos recebido.', isError: true });
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    try {
      const result = await verifyOtpCode(db, cleanDigits, cleanCode, lastGeneratedCode || undefined);

      if (result.success) {
        // Save verified in Firestore and local storage
        await savePhoneVerifiedFirestore(db, cleanDigits, customerName, 'otp_code');
        onVerified(cleanDigits);
        setCodeSent(false);
        setFeedback({ text: '🎉 WhatsApp verificado com sucesso! Suas próximas compras serão liberadas automaticamente.', isError: false });
      } else {
        setFeedback({ text: result.error || 'Código incorreto. Confira os números digitados.', isError: true });
      }
    } catch (err) {
      console.error("Error verifying code:", err);
      setFeedback({ text: 'Erro ao validar código. Tente novamente.', isError: true });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCode = () => {
    if (!lastGeneratedCode) return;
    navigator.clipboard.writeText(lastGeneratedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAutoFillCode = () => {
    if (!lastGeneratedCode) return;
    setVerificationCodeInput(lastGeneratedCode);
  };

  if (!enabled) {
    // Normal phone input without verification
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            Telefone / WhatsApp *
          </label>
          <span className="text-[10px] text-neutral-400 font-medium">Obrigatório</span>
        </div>
        <input
          type="tel"
          placeholder="(DDD) 99999-9999"
          className={cn(
            "w-full p-3.5 bg-neutral-50 border rounded-2xl focus:outline-none transition-all text-sm font-mono sm:font-sans",
            error ? "border-red-500 ring-2 ring-red-100" : "border-neutral-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
          )}
          value={phone || ''}
          onChange={handleInputChange}
        />
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-medium pl-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          Telefone / WhatsApp *
        </label>
        {isVerified ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verificado ✅
          </span>
        ) : (
          <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
            Verificação na 1ª compra
          </span>
        )}
      </div>

      {/* Main Phone Input */}
      <div className="relative">
        <input
          type="tel"
          placeholder="(DDD) 99999-9999"
          className={cn(
            "w-full p-3.5 pr-28 bg-neutral-50 border rounded-2xl focus:outline-none transition-all text-sm font-mono sm:font-sans",
            error
              ? "border-red-500 ring-2 ring-red-100"
              : isVerified
              ? "border-emerald-400 bg-emerald-50/20 text-neutral-900 focus:border-emerald-500"
              : "border-neutral-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
          )}
          value={phone || ''}
          onChange={handleInputChange}
        />

        {/* Verification Status Badge inside Input */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isVerified ? (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xs">
              <CheckCircle2 className="w-3 h-3" />
              <span>OK</span>
            </div>
          ) : isValidFormat ? (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending || cooldownSeconds > 0}
              className="px-2.5 py-1.5 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Solicitar código de verificação no WhatsApp"
            >
              {isSending ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>{codeSent ? 'Reenviar' : 'Validar'}</span>
            </button>
          ) : null}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 font-medium pl-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {/* Verified Status Banner */}
      {isVerified && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
          <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-grow text-[11px]">
            <p className="font-bold text-emerald-950">WhatsApp Confirmado & Salvo!</p>
            <p className="text-emerald-800">
              Seu número está verificado. Você não precisa mais digitar códigos nesta e nas próximas compras!
            </p>
          </div>
        </div>
      )}

      {/* Unverified Explanation & Code Request Section */}
      {!isVerified && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-brand-cream/80 to-amber-500/10 border border-amber-300/60 rounded-2xl space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-neutral-900 flex items-center gap-1">
                <span>Proteção Contra Pedidos Falsos</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                  1ª Compra
                </span>
              </p>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Para garantir que ninguém faça pedidos no seu número ou informe WhatsApp de outra pessoa, 
                precisamos validar seu número uma única vez. As compras futuras serão liberadas automaticamente!
              </p>
            </div>
          </div>

          {!codeSent ? (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending || !isValidFormat}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando Código de Segurança...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Solicitar Código de Confirmação</span>
                </>
              )}
            </button>
          ) : (
            /* Code Entry Interface */
            <div className="pt-2 border-t border-amber-200/60 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Digite o código de 6 dígitos:
                </span>

                {cooldownSeconds > 0 ? (
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Reenviar em {cooldownSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSending}
                    className="text-[11px] font-bold text-brand-wine hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reenviar Novo Código
                  </button>
                )}
              </div>

              {/* Assistance / Test Banner with Fast Auto-fill */}
              {lastGeneratedCode && (
                <div className="p-2.5 bg-white border border-brand-gold/40 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Código Gerado:</span>
                    <span className="font-mono text-sm font-black text-brand-wine tracking-widest">
                      {lastGeneratedCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAutoFillCode}
                      className="px-2.5 py-1 bg-brand-wine/10 hover:bg-brand-wine/20 text-brand-wine rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="Preencher campo com este código"
                    >
                      Preencher
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 hover:bg-neutral-100 text-neutral-600 rounded-lg transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Direct WhatsApp Confirmation Button */}
              {whatsappDirectUrl && (
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Abrir WhatsApp para Validar Número com a Loja</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              {/* 6-Digit Code Input Form */}
              <form onSubmit={handleVerifyCode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  className="flex-grow p-3 bg-white border border-neutral-300 rounded-xl text-center text-lg font-mono font-black tracking-[0.3em] focus:outline-none focus:border-brand-wine focus:ring-2 focus:ring-brand-wine/20 transition-all text-neutral-900"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  type="submit"
                  disabled={isVerifying || verificationCodeInput.length < 4}
                  className="px-4 py-3 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-md cursor-pointer flex items-center justify-center shrink-0 min-w-[100px]"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {feedback && (
            <p className={cn(
              "text-xs p-2 rounded-xl flex items-center gap-1.5 font-medium",
              feedback.isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            )}>
              {feedback.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              <span>{feedback.text}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
