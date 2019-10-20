const Discord = require('discord.js');
const cheerio = require('cheerio');
const request = require('request');

// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level) => {
  const search = args.join(' ');
  const link = `https://duckduckgo.com/?q=%5C${escape(search)}+site%3Anookipedia.com`;

  const waitingMsg = await message.channel.send('Please wait while Nookbot counts its bells...');

  request(link, (err, res, html) => {
    if (err || res.statusCode !== 200) {
      waitingMsg.delete();
      return message.error('Invalid Search Terms!', 'Please check your spelling and that what you searched for actually exists!');
    }

    const nookLink = html.match(/(?<=uddg=)[^']+/);

    request(unescape(nookLink), (err2, res2, html2) => {
      if (err2 || res2.statusCode !== 200) {
        waitingMsg.delete();
        return message.error('Invalid Search Terms!', 'Please check your spelling and that what you searched for actually exists!');
      }
      
      const $ = cheerio.load(html2);
      const output = $('.mw-parser-output');

      let hasAPI = false;
      let name, gender, personality, image, bio, color = 'RANDOM';

      output.find('p').eq(0).find('span').each((i, elem) => {
        switch($(elem).attr('id')) {
          case 'api-villager_name':
            hasAPI = true;
            name = $(elem).text().trim();
            break;
          case 'api-villager_image':
            image = $(elem).find('a').attr('href');
            break;
          case 'api-villager_gender':
            gender = $(elem).text().trim();
            break;
          case 'api-villager_personality':
            personality = $(elem).text().trim();
            break;
        }
      });

      if (hasAPI) {
        bio = output.find('p').eq(1).text();
      } else {
        let foundInfoBox = false;
        const infoBox = output.find('table').filter((i, elem) => {
          foundInfoBox = true;
          return $(elem).attr('id') == 'Infobox-villager';
        });
        if (foundInfoBox) {
          name = infoBox.find('tr').first().text().trim();
          image = `https://nookipedia.com${infoBox.find('img', 'a').attr('src')}`;
          gender = (infoBox.text().match(/(Male|Female)/) || [''])[0];
          bio = output.find('p').eq(0).text();
        } else {
          name = output.find('table').eq(1).find('tr').first().text().trim();
          image = `https://nookipedia.com${output.find('table').eq(1).find('img', 'a').attr('src')}`;
          gender = output.find('table').eq(1).text().match(/(Male|Female)/)[0];
          bio = output.find('p').eq(0).text();
        }
      }
      
      switch(personality || gender) {
        case 'Cranky':
          color = '#ff9292';
          break;
        case 'Jock':
          color = '#6eb5ff';
          break;
        case 'Lazy':
          color = '#f8e081';
          break;
        case 'Normal':
          color = '#bdecb6';
          break;
        case 'Peppy':
          color = '#ffccf9';
          break;
        case 'Smug':
          color = '#97a2ff';
          break;
        case 'Snooty':
          color = '#d5aaff';
          break;
        case 'Uchi':
          color = '#ffbd61';
          break;
        case 'Male':
          color = '#61abff';
          break;
        case 'Female':
          color = '#efb5d5';
          break;
      }

      const embed = new Discord.RichEmbed()
        .setColor(color)
        .setTimestamp()
        .setAuthor(message.author.tag, message.author.displayAvatarURL)
        .setTitle(name)
        .setDescription(`${bio}[Read More](${unescape(nookLink).slice(0,29)}${unescape(nookLink).slice(29).replace('(','%28').replace(')', '%29')})`)
        .setImage(image)
        .setFooter('Info from Nookipedia', client.user.displayAvatarURL);

      waitingMsg.delete();
      return message.channel.send(embed);
    });
  });
};

module.exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['character', 'char', 'villager', 'vil', 'item'],
  permLevel: 'User',
  args: 1,
};

module.exports.help = {
  name: 'wiki',
  category: 'game',
  description: 'Gets info from the wiki on specified search',
  usage: 'wiki <search>',
};
