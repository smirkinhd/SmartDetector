using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;
using System.Threading.Tasks;
using BackendGermanSmartDetector.AppDbContext;
using BackendGermanSmartDetector.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendGermanSmartDetector.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class RegistrationController: ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RegistrationController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Users user)
        {
            if (user == null)
            {
                return BadRequest(new { message = "Некорректные данные" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Проверьте корректность введённых данных", errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)) });
            }

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == user.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "Пользователь с таким email или телефоном уже зарегистрирован" });
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Created("", new { message = "Успешная регистрация" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка регистрации: {ex.Message}");
                return StatusCode(500, new { message = "Произошла ошибка во время регистрации. Попробуйте позже." });
            }
        }
    }
}
