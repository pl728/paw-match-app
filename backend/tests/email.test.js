import { jest } from '@jest/globals';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = jest.fn().mockReturnValue({ sendMail: mockSendMail });

jest.unstable_mockModule('nodemailer', () => ({
    default: { createTransport: mockCreateTransport }
}));

const { sendEmail } = await import('../services/email.js');

beforeEach(function () {
    mockSendMail.mockClear();
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_FROM = 'Paw Match <test@example.com>';
});

describe('sendEmail', function () {
    it('calls sendMail with correct to, subject, and html body', async function () {
        await sendEmail({ to: 'adopter@example.com', subject: 'Test Subject', body: '<p>Hello</p>' });

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'adopter@example.com',
            subject: 'Test Subject',
            html: '<p>Hello</p>'
        }));
    });

    it('sends from EMAIL_FROM when set', async function () {
        await sendEmail({ to: 'user@example.com', subject: 'Hi', body: '<p>Hi</p>' });

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: 'Paw Match <test@example.com>'
        }));
    });

    it('falls back to EMAIL_USER as from address when EMAIL_FROM is not set', async function () {
        delete process.env.EMAIL_FROM;

        await sendEmail({ to: 'user@example.com', subject: 'Hi', body: '<p>Hi</p>' });

        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: 'test@example.com'
        }));
    });
});
