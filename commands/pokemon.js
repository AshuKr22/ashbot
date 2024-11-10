import { SlashCommandBuilder,createComponentBuilder,EmbedBuilder,ButtonBuilder,ButtonStyle } from "discord.js";
import { log } from "node:console";
import { stringify } from "node:querystring";

const pokedexEntry = async (Pokname) => {  
    try {
        const response= await fetch(`https://pokeapi.co/api/v2/pokemon/${Pokname}`)
                             
        if(!response.ok)
            {
                const message = "It is not a valid pokemon name"
                return message;         
            }
        const pokeInfo = await response.json();
       
        
        
            const pokename = pokeInfo.name;
            console.log(pokename);
            const moveArr = await pokeInfo.moves.slice(0,4);

            const moves = moveArr.map((move)=>move?.move?.name);
            console.log("moves : ",moves);
            const sprite = pokeInfo.sprites.front_default;

           
            const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Pokemon Info')
            .addFields(
                { name: "name", value:`${Pokname}` },
                { name: "moves", value: moves.map((move,idx)=>`${idx+1}. ${move}`).join('\n') }
            )
            .setImage(sprite);
            return embed

            
            
        
    } catch (error) {
        console.log("error: ",error);
        
        
    }
    
 
    


    

}

export default{
    data: new SlashCommandBuilder()
    .setName('pokemon')
    .setDescription('Replies with a POKEDÉX entry of a pokemon name')
    .addStringOption(option=>
        option.setName('pokemon-name')
        .setDescription('The name of the pokemon to see info.')
        .setRequired(true)

    ),

    async execute(interaction){

        const pokemonName = interaction.options.getString('pokemon-name');
        const pokeInfo = await pokedexEntry(pokemonName)

        
        await interaction.channel.send({embeds:[pokeInfo] });


    }
    
    
}
