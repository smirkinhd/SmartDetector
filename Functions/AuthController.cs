using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BackendGermanSmartDetector.Classes;
using System.Text;
using BackendGermanSmartDetector.AppDbContext;
using Microsoft.AspNetCore.Authorization;

namespace BackendGermanSmartDetector.Functions
{
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
            if (string.IsNullOrEmpty(jwtSecret))
            {
                Console.Error.WriteLine("JWT_SECRET не определен");
                return StatusCode(500, new { error = "Ошибка сервера" });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(jwtSecret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                new Claim("userId", user.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new { token = tokenString });
        }
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { error = "Не удалось получить токен пользователя" });
                }

                var userId = userIdClaim.Value;

                var user = await _context.Users
                    .Where(u => u.Id.ToString() == userId)
                    .Select(u => new { u.Email, u.Phone })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { error = "Пользователь не найден" });
                }

                return Ok(new { email = user.Email, phone = user.Phone });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Ошибка получения профиля", details = ex.Message });
            }
        }
    }
}
