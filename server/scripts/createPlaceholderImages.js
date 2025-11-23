const fs = require('fs');
const path = require('path');


const createDirectories = () => {
  const dirs = [
    path.join(__dirname, '../uploads/books'),
    path.join(__dirname, '../uploads/news'),
    path.join(__dirname, '../uploads/avatars'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};


const createPlaceholders = () => {
  const placeholders = [
    { dir: 'books', files: ['book1.png', 'book2.png', 'book3.png', 'book4.png', 'book5.png', 'book6.png'] },
    { dir: 'news', files: ['event1.jpg', 'news1.jpg', 'event2.jpg', 'news2.jpg'] },
  ];

  placeholders.forEach(({ dir, files }) => {
    files.forEach(file => {
      const filePath = path.join(__dirname, `../uploads/${dir}/${file}`);
      if (!fs.existsSync(filePath)) {
        
        fs.writeFileSync(filePath, `Placeholder image: ${file}\nReplace this with actual image file.`);
        console.log(`Created placeholder: ${filePath}`);
      }
    });
  });
};


createDirectories();
createPlaceholders();
console.log('Placeholder images created successfully!');
console.log('Note: Replace placeholder files with actual images.');

