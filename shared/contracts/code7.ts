// Generation of 7 alphanumeric codes

export function generateCode7(): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codeLength = 7;
    let result = '';

    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }

    return result;
}