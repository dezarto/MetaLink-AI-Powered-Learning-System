using System.Security.Cryptography;
using System.Text;
using MetaLink.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MetaLink.Persistence.Services
{
    public class AESEncryptionService : IEncryptionService
    {
        private readonly byte[] _key;
        private readonly byte[] _iv;

        public AESEncryptionService(IConfiguration configuration)
        {
            _key = Convert.FromBase64String(configuration["Encryption:Key"]);
            _iv = Convert.FromBase64String(configuration["Encryption:IV"]);
        }

        public string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            var encryptor = aes.CreateEncryptor();
            var plainBytes = Encoding.UTF8.GetBytes(plainText);

            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
            return Convert.ToBase64String(cipherBytes);
        }

        public string Decrypt(string cipherText)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            var decryptor = aes.CreateDecryptor();
            var cipherBytes = Convert.FromBase64String(cipherText);

            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
    }
}
