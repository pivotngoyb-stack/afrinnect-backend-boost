/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Afrinnect! Confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoArea}>
          <Text style={logoText}>💜 Afrinnect</Text>
        </div>
        <Heading style={h1}>Welcome to Afrinnect!</Heading>
        <Text style={text}>
          We're excited to have you join our community. Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify My Email
        </Button>
        <Text style={footer}>
          If you didn't create an account on Afrinnect, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logoArea = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#6b21a8', margin: '0' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#666666',
  lineHeight: '1.6',
  margin: '0 0 28px',
}
const link = { color: '#6b21a8', textDecoration: 'underline' }
const button = {
  backgroundColor: '#6b21a8',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'block',
  textAlign: 'center' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0', textAlign: 'center' as const }
