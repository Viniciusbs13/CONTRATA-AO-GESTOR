/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ArrowRight, 
  CheckCircle2, 
  Send
} from 'lucide-react';
import { cn } from './lib/utils';
import { db } from './firebase';
import { collection, setDoc, doc, serverTimestamp, getDocFromServer } from 'firebase/firestore';

// ... inside App component or before it ...

const testConnection = async () => {
  try {
    // Just a ping to the server to check connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client appears to be offline.");
    }
  }
};

// Call it once
testConnection();

// --- Types ---

interface Question {
  id: string;
  category: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio';
  options?: string[];
  placeholder?: string;
}

// --- Data ---

const QUESTIONS: Question[] = [
  // 👤 Dados Pessoais
  { id: 'nome', category: 'Dados Pessoais', question: 'Qual é o seu nome completo?', type: 'text', placeholder: 'Digite seu nome...' },
  { id: 'idade', category: 'Dados Pessoais', question: 'Qual é a sua idade?', type: 'text', placeholder: 'Ex: 25' },
  { id: 'telefone', category: 'Dados Pessoais', question: 'Qual é o seu telefone/WhatsApp?', type: 'text', placeholder: '(00) 00000-0000' },
  { id: 'tem_experiencia', category: 'Dados Pessoais', question: 'Você já teve experiência como gestor de tráfego?', type: 'radio', options: ['Sim', 'Não'] },

  // 🎯 Experiência e Histórico
  { id: 'nichos', category: 'Experiência e Histórico', question: 'Quais nichos você já trabalhou?', type: 'textarea', placeholder: 'Ex: E-commerce, Infoprodutos, Local...' },
  { id: 'investimento', category: 'Experiência e Histórico', question: 'Qual foi o maior investimento mensal gerenciado?', type: 'text', placeholder: 'R$ 0,00' },
  { id: 'cases', category: 'Experiência e Histórico', question: 'Pode compartilhar cases com resultados reais? (O examinador solicitará esses resultados durante a entrevista)', type: 'textarea', placeholder: 'Descreva brevemente seus melhores resultados...' },
  { id: 'tempo', category: 'Experiência e Histórico', question: 'Há quanto tempo trabalha como gestor de tráfego?', type: 'select', options: ['Menos de 1 ano', '1-2 anos', '2-5 anos', 'Mais de 5 anos'] },

  // 📊 Competências Técnicas
  { id: 'plataformas', category: 'Competências Técnicas', question: 'Quais plataformas você domina?', type: 'textarea', placeholder: 'Meta Ads, Google Ads, TikTok Ads...' },
  { id: 'plataformas_gerenciamento', category: 'Competências Técnicas', question: 'Quais plataformas de gerenciamento você sabe utilizar?', type: 'textarea', placeholder: 'Ex: Trello, ClickUp, Slack, CRM...' },
  { id: 'expectativa_salarial', category: 'Dados Pessoais', question: 'Qual sua expectativa salarial?', type: 'text', placeholder: 'R$ 0,00' },
  { id: 'estrutura', category: 'Competências Técnicas', question: 'Como você estrutura uma campanha do zero?', type: 'textarea' },
  { id: 'leitura', category: 'Competências Técnicas', question: 'Como você faz a leitura de dados?', type: 'textarea' },
  { id: 'pixels', category: 'Competências Técnicas', question: 'Configura pixels e eventos sozinho?', type: 'radio', options: ['Sim, tudo', 'Dependo de suporte', 'Apenas o básico'] },
  { id: 'funil', category: 'Competências Técnicas', question: 'Experiência com geração de leads e conversão?', type: 'radio', options: ['Sim, ambos', 'Apenas Leads', 'Apenas Conversão', 'Nenhuma'] },

  // 🧠 Raciocínio Estratégico
  { id: 'diagnostico', category: 'Raciocínio Estratégico', question: 'Qual seu processo de diagnóstico?', type: 'textarea' },
  { id: 'alinhamento', category: 'Raciocínio Estratégico', question: 'Como alinha tráfego com o funil de vendas?', type: 'textarea' },
  { id: 'expectativa', category: 'Raciocínio Estratégico', question: 'Como lida com baixa verba e alta expectativa?', type: 'textarea' },

  // 💼 Modelo de Trabalho (PJ)
  { id: 'carteira', category: 'Modelo de Trabalho', question: 'Quantos clientes atende simultaneamente?', type: 'text' },
  { id: 'comunicacao', category: 'Modelo de Trabalho', question: 'Disponibilidade e ferramenta de comunicação?', type: 'text', placeholder: 'Ex: WhatsApp, Horário comercial...' },
  { id: 'relatorios', category: 'Modelo de Trabalho', question: 'Frequência e formato de relatórios?', type: 'text' },
  { id: 'contrato', category: 'Modelo de Trabalho', question: 'Trabalha com contrato e tem CNPJ ativo?', type: 'radio', options: ['Sim, ambos', 'Apenas CNPJ', 'Apenas Contrato', 'Nenhum'] },

  // 🔴 Perguntas "Eliminatórias"
  { id: 'falha', category: 'Eliminatórias', question: 'Qual resultado NÃO conseguiu entregar e por quê?', type: 'textarea' },
  { id: 'conflito', category: 'Eliminatórias', question: 'Já trabalhou com clientes concorrentes?', type: 'radio', options: ['Sim', 'Não'] },
  { id: 'baixa', category: 'Eliminatórias', question: 'Como lida com meses de baixa performance?', type: 'textarea' },
];

// --- Components ---

const Logo = () => (
  <div className="flex items-center">
    <span className="text-white font-bold text-[24px] tracking-tighter leading-none">OMEGA</span>
  </div>
);

const PillButton = ({ children, onClick, variant = 'black', className }: { children: React.ReactNode, onClick?: () => void, variant?: 'black' | 'white', className?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "pill-button-outer group transition-transform active:scale-95",
      className
    )}
  >
    <div className="glow-streak" />
    <div className={cn(
      "px-[29px] py-[11px] rounded-full font-medium text-[14px] flex items-center justify-center",
      variant === 'black' ? "bg-black text-white" : "bg-white text-black"
    )}>
      {children}
    </div>
  </button>
);

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-[120px] py-[20px]">
    <Logo />
  </nav>
);

export default function App() {
  const [step, setStep] = useState<'hero' | 'quiz' | 'success'>('hero');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const nextStep = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const timestamp = Date.now();
      const candidateName = answers['nome']?.replace(/\s+/g, '_') || 'Candidato';
      const docId = `${candidateName}_${timestamp}`;
      
      await setDoc(doc(db, 'submissions', docId), {
        ...answers,
        submittedAt: serverTimestamp()
      });
      
      // Track Meta Pixel Lead event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead');
      }

      setStep('success');
    } catch (error) {
      console.error("Error saving submission:", error);
      alert("Ocorreu um erro ao enviar sua aplicação. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black selection:bg-white selection:text-black font-general">
      <Navbar />

      <AnimatePresence mode="wait">
        {step === 'hero' && (
          <motion.section 
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-screen w-full flex flex-col items-center overflow-hidden"
          >
            {/* Video Background */}
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover z-0"
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/50 z-[1]" />

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-full gap-[40px] max-w-4xl mx-auto">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-6"
              >
                <h1 className="text-gradient text-[40px] md:text-[64px] font-medium leading-[1.1] tracking-tight">
                  Analise seu potencial <br />
                  <span className="italic">e</span> junte-se ao nosso time.
                </h1>
                <p className="text-white/70 text-[16px] md:text-[18px] font-normal max-w-[600px] leading-relaxed">
                  Buscamos gestores de tráfego que dominam dados, estratégia e execução. 
                  Responda nosso quiz técnico para validar suas competências.
                </p>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <PillButton variant="white" onClick={() => setStep('quiz')} className="scale-110">
                  Iniciar Avaliação
                </PillButton>
              </motion.div>
            </div>
          </motion.section>
        )}

        {step === 'quiz' && (
          <motion.section 
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background Video for Quiz too */}
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/80 z-[1]" />

            <div className="relative z-10 w-full max-w-2xl">
              {/* Progress Bar */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white/40 text-[12px] uppercase tracking-widest font-medium">
                    {currentQuestion.category}
                  </span>
                  <span className="text-white/20 text-[12px] font-mono">
                    {currentQuestionIndex + 1} / {QUESTIONS.length}
                  </span>
                </div>
                <div className="h-[1px] w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="glass-card rounded-[32px] p-8 md:p-12 min-h-[400px] flex flex-col">
                <h2 className="text-[24px] md:text-[32px] font-medium mb-10 leading-tight text-gradient">
                  {currentQuestion.question}
                </h2>

                <div className="flex-grow">
                  {currentQuestion.type === 'textarea' && (
                    <textarea 
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-[16px] p-5 text-white focus:border-white/30 outline-none transition-all min-h-[150px] resize-none text-[16px]"
                      placeholder={currentQuestion.placeholder || "Sua resposta..."}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                  )}

                  {currentQuestion.type === 'text' && (
                    <input 
                      autoFocus
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-[16px] p-5 text-white focus:border-white/30 outline-none transition-all text-[16px]"
                      placeholder={currentQuestion.placeholder || "Sua resposta..."}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                  )}

                  {currentQuestion.type === 'select' && (
                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion.options?.map(option => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          className={cn(
                            "w-full p-5 rounded-[16px] border text-left transition-all text-[16px] font-medium",
                            answers[currentQuestion.id] === option 
                              ? "bg-white text-black border-white" 
                              : "bg-white/5 border-white/10 text-white/70 hover:border-white/30"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'radio' && (
                    <div className="grid grid-cols-1 gap-3">
                      {currentQuestion.options?.map(option => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          className={cn(
                            "w-full p-5 rounded-[16px] border text-left transition-all flex items-center justify-between text-[16px] font-medium",
                            answers[currentQuestion.id] === option 
                              ? "bg-white/10 border-white text-white" 
                              : "bg-white/5 border-white/10 text-white/70 hover:border-white/30"
                          )}
                        >
                          <span>{option}</span>
                          {answers[currentQuestion.id] === option && <CheckCircle2 size={20} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-12">
                  <button 
                    onClick={prevStep}
                    disabled={currentQuestionIndex === 0}
                    className="text-white/60 hover:text-white disabled:opacity-0 transition-colors font-medium text-[16px] flex items-center gap-2"
                  >
                    Voltar
                  </button>
                  <PillButton 
                    variant="white"
                    onClick={nextStep}
                    className={cn(!answers[currentQuestion.id] && "opacity-50 pointer-events-none")}
                  >
                    {currentQuestionIndex === QUESTIONS.length - 1 ? (isSubmitting ? 'Enviando...' : 'Finalizar') : 'Próxima'}
                  </PillButton>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {step === 'success' && (
          <motion.section 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-screen w-full flex items-center justify-center px-6 relative"
          >
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-20"
            >
              <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
            </video>
            <div className="glass-card rounded-[48px] p-12 md:p-20 text-center max-w-2xl relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-white/20">
                <Send size={32} className="text-white" />
              </div>
              
              <h2 className="text-[40px] md:text-[56px] font-medium mb-8 text-gradient">Aplicação Concluída</h2>
              <p className="text-[18px] text-white/70 mb-8 leading-relaxed">
                Obrigado, <span className="text-white font-bold">{answers['nome']}</span>. 
                Analisaremos seu potencial e entraremos em contato em breve.
              </p>

              <div className="mb-12">
                <p className="text-white/50 text-[14px] mb-4 uppercase tracking-widest font-bold">Acompanhe nosso trabalho</p>
                <a 
                  href="https://www.instagram.com/assessoria.omega?igsh=c3Ewa2FxcWtvZnNy&utm_source=qr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-8 py-4 rounded-full text-white font-bold hover:scale-105 transition-transform shadow-lg"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  Seguir no Instagram
                </a>
              </div>
              
              <PillButton variant="white" onClick={() => window.location.reload()}>
                Voltar ao Início
              </PillButton>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
