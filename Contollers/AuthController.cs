using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BackendGermanSmartDetector.Models;
using System.Text;
using BackendGermanSmartDetector.AppDbContext;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;

namespace BackendGermanSmartDetector.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AuthController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginModel loginModel)
        {
            if (string.IsNullOrWhiteSpace(loginModel.Email) || string.IsNullOrWhiteSpace(loginModel.Password))
            {
                return BadRequest(new { error = "Email и пароль обязательны" });
            }

            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == loginModel.Email);
            if (user == null)
            {
                return NotFound(new { error = "Пользователь не найден" });
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(loginModel.Password, user.Password);
            if (!isPasswordValid)
            {
                return Unauthorized(new { error = "Неверные учетные данные" });
            }

            var jwtSecret = _configuration["JWT_SECRET"];
            if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32) 
            {
                return StatusCode(500, new { error = "Ошибка сервера: секретный ключ JWT слишком короткий" });
            }

            var key = Encoding.ASCII.GetBytes(jwtSecret);

            var tokenHandler = new JwtSecurityTokenHandler();

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[] { new Claim("userId", user.Id.ToString()) }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new { token = tokenString });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
         {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { error = "Токен отсутствует" });
                }

                return Created("", new { message = "Успешная проверка" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Ошибка получения профиля", details = ex.Message });
            }
        }


    }
}
