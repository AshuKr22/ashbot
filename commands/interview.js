import { SlashCommandBuilder, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
const questions = [
    {
        question: "What is the output of: console.log(typeof NaN)?",
        options: ["'undefined'", "'number'", "'NaN'", "'object'"],
        correct: 1,
        roast: "Ha! Even a bootcamp dropout knows that NaN is technically a number. Maybe you should stick to HTML! 🤦‍♂️"
    },
    {
        question: "What's the result of: [] + {}?",
        options: ["'[object Object]'", "0", "[]", "TypeError"],
        correct: 0,
        roast: "WRONG! JavaScript type coercion strikes again! Did you learn programming from a cereal box? 😤"
    },
    {
        question: "How do you properly check if an object is an array?",
        options: ["typeof obj === 'array'", "obj instanceof Array", "Array.isArray(obj)", "obj.isArray()"],
        correct: 2,
        roast: "Oh sweetie... Array.isArray() is day one stuff. My grandmother knows this, and she doesn't even code! 🤣"
    },
    {
        question: "What's the value of: console.log(('b' + 'a' + + 'a' + 'a').toLowerCase())?",
        options: ["'baaa'", "'baNaNa'", "'banana'", "'ba+a+a'"],
        correct: 1,
        roast: "BANANA! Get it? Because of type coercion! Maybe you should go back to Python where everything makes sense! 😩"
    },
    {
        question: "What's the output of: console.log(0.1 + 0.2 === 0.3)?",
        options: ["true", "false", "undefined", "TypeError"],
        correct: 1,
        roast: "FALSE! Floating-point precision is like basic arithmetic! Did you skip math class to learn jQuery? 😫"
    },
    {
        question: "What happens when you try to destructure undefined?",
        options: ["Nothing", "null", "undefined", "TypeError"],
        correct: 3,
        roast: "TypeError! Just like it's a TypeError to call you a developer! Just kidding... maybe. 😏"
    },
    {
        question: "What's the output of: console.log([,,,].length)?",
        options: ["0", "3", "4", "undefined"],
        correct: 1,
        roast: "Wrong! Those commas create empty slots! Maybe you should count how many brain cells you have left! 🙄"
    },
    {
        question: "What's the result of: typeof typeof 1?",
        options: ["'number'", "'string'", "'undefined'", "'type'"],
        correct: 1,
        roast: "WRONG! typeof ALWAYS returns a string! Did you learn JavaScript from a 'JavaScript for Dummies' book? 😤"
    }
];
let userScores = new Map();

function getRandomQuestions(array, count) {
    let shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function createButtons(disabled = false) {
    const row = new ActionRowBuilder();
    for (let i = 0; i < 4; i++) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`answer_${i}`)
                .setLabel(`${i + 1}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled)
        );
    }
    return row;
}

async function askQuestion(interaction, userData) {
    const question = userData.questions[userData.currentQuestion];
    console.log("userData is : ",userData);

    
    console.log("questions is : ",question);
    
    
    const row = await createButtons();

    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('JavaScript Interview')
        .addFields(
            { name: `Question ${userData.currentQuestion + 1}/5`, value: question.question },
            { name: 'Options', value: question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n') }
        );

    const content = userData.currentQuestion === 0 
        ? "*Adjusts glasses angrily*\n\n**Listen up, wannabe developer! Let's see if you actually know JavaScript or if you've just been copying from Stack Overflow!**"
        : undefined;

    return await interaction.channel.send({
        content,
        embeds: [embed],
        components: [row]
    });
}

export default {
    data: new SlashCommandBuilder()
        .setName('interview')
        .setDescription('Start a JavaScript interview with an angry interviewer'),

    async execute(interaction) {
        await interaction.deferReply();
        
        // Initialize user's score
        userScores.set(interaction.user.id, {
            score: 0,
            currentQuestion: 0,
            questions: getRandomQuestions(questions, 5)
        });

        const userData = userScores.get(interaction.user.id);
        let currentMessage = await askQuestion(interaction, userData);
        await interaction.deleteReply();

        async function handleAnswer(i) {
            try {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({ content: "This isn't your interview! Go write some documentation or something! 😤", ephemeral: true });
                    return;
                }

                const userData = userScores.get(interaction.user.id);
                if (!userData) return;

                const currentQuestion = userData.questions[userData.currentQuestion];
                const userAnswer = parseInt(i.customId.split('_')[1]);

                // Disable buttons after answer
                const disabledRow = await createButtons(true);
                await currentMessage.edit({ components: [disabledRow] });

                if (userAnswer === currentQuestion.correct) {
                    userData.score++;
                    await i.reply("**Hmph! Lucky guess...** 😒");
                } else {
                    await i.reply(currentQuestion.roast);
                }

                userData.currentQuestion++;

                if (userData.currentQuestion < 5) {
                    // Add a small delay before next question
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    // Ask next question
                    currentMessage = await askQuestion(interaction, userData);
                } else {
                    // Final results
                    const finalEmbed = new EmbedBuilder()
                        .setColor(userData.score >= 3 ? 0x00FF00 : 0xFF0000)
                        .setTitle('Interview Results')
                        .setDescription(userData.score >= 3 
                            ? `*Adjusts glasses reluctantly*\n\nFine... you passed. ${userData.score}/5 correct. But I bet you can't center a div without Flexbox! 😤`
                            : `*Laughs maniacally*\n\nJust as I thought! ${userData.score}/5 correct. Maybe try becoming a project manager instead! 🤣`);

                    await interaction.channel.send({ embeds: [finalEmbed] });
                    userScores.delete(interaction.user.id);
                }
            } catch (error) {
                console.error("Error in handleAnswer:", error);
                await interaction.channel.send("There was an error processing your answer! Even my code is judging you! 😤");
            }
        }

        // Create collector for the entire interview session
        const filter = i => i.customId.startsWith('answer_');
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 180000 // 3 minutes for the entire quiz
        });

        collector.on('collect', handleAnswer);

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && userScores.has(interaction.user.id)) {
                await interaction.channel.send("Time's up! Too slow, just like your code! 😈");
                userScores.delete(interaction.user.id);
            }
        });
    }
};