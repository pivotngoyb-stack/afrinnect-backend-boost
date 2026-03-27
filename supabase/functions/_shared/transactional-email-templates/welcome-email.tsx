/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Afrinnect'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your journey starts now! 💜</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={logoText}>💜 {SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>
          {name ? `Welcome, ${name}!` : 'Welcome to Afrinnect!'}
        </Heading>

        <Text style={text}>
          We're thrilled to have you join the premier dating platform for African 
          singles and diaspora worldwide. Your perfect match could be just a swipe away.
        </Text>

        <Section style={tipsSection}>
          <Text style={tipHeader}>Get started in 3 easy steps:</Text>
          <Text style={tipItem}>📸 Add your best photos — profiles with 3+ photos get 5x more matches</Text>
          <Text style={tipItem}>✍️ Write a bio that shows your personality</Text>
          <Text style={tipItem}>💜 Send your first like to break the ice!</Text>
        </Section>

        <Section style={ctaSection}>
          <Button style={button} href="https://afrinnect-heartbeat.lovable.app/home">
            Start Exploring
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          With love, The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: (data: Record<string, any>) =>
    data?.name ? `Welcome to Afrinnect, ${data.name}! 💜` : 'Welcome to Afrinnect! 💜',
  displayName: 'Welcome email',
  previewData: { name: 'Amara' },
} satisfies TemplateEntry

// Styles — Afrinnect brand: primary purple hsl(271, 60%, 45%) = #6B21A8-ish
const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '32px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#6D28D9', margin: '0' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#1C1917', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#57534E', lineHeight: '1.6', margin: '0 0 24px' }
const tipsSection = { backgroundColor: '#FAF5FF', borderRadius: '12px', padding: '20px 24px', marginBottom: '28px' }
const tipHeader = { fontSize: '15px', fontWeight: '600' as const, color: '#1C1917', margin: '0 0 12px' }
const tipItem = { fontSize: '14px', color: '#57534E', lineHeight: '1.5', margin: '0 0 8px' }
const ctaSection = { textAlign: 'center' as const, marginBottom: '32px' }
const button = {
  backgroundColor: '#6D28D9',
  color: '#ffffff',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: '600' as const,
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#E7E5E4', margin: '0 0 20px' }
const footer = { fontSize: '13px', color: '#A8A29E', margin: '0', textAlign: 'center' as const }
