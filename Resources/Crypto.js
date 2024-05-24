const crypto = require('crypto'); 

const Decrypt=(encryptedText,key)=>{
    const decipher = crypto.createDecipheriv('aes-256-ecb', key,'');
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    return decrypted += decipher.final('utf8');
}

const Encrypt=(text,key)=>{
    const cipher = crypto.createCipheriv('aes-256-ecb', key, '');
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}



module.exports = {Decrypt,Encrypt};