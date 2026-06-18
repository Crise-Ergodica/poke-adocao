"""
Seed local do banco do projeto poke-adocao.

Este script popula o SQLite local com:
- usuários de teste
- Pokemon no mapa
- Pokemon já adotados na party de alguns usuários
- adoções disponíveis no Adoption Board

Banco usado pelo projeto:
backend/poke_adocao.db
"""

from datetime import datetime, timedelta
from pathlib import Path
import shutil

from app.database import Base, engine, SessionLocal
from app.models import User, UserPokemon, PokemonEntity, Adoption, AdoptionStatus
from app.auth_service import get_password_hash


def backup_database_file() -> None:
    """
    Cria um backup simples do banco antes de limpar e popular.

    Se o banco ainda não existir, não faz nada.
    """
    db_path = Path("poke_adocao.db")

    if not db_path.exists():
        return

    backup_path = Path(f"poke_adocao_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
    shutil.copyfile(db_path, backup_path)
    print(f"Backup criado: {backup_path}")


def reset_tables(db) -> None:
    """
    Limpa as tabelas na ordem correta para evitar problema com Foreign Key.
    """
    db.query(Adoption).delete()
    db.query(UserPokemon).delete()
    db.query(PokemonEntity).delete()
    db.query(User).delete()
    db.commit()


def create_users(db) -> dict[str, User]:
    """
    Cria usuários de teste.

    Senha padrão de todos:
    Senha123
    """
    now = datetime.utcnow()

    users_data = [
        {
            "email": "ash@poke.com",
            "user_id": "ash",
            "latitude": -19.5312,
            "longitude": -42.6105,
            "icon_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
            "companion_pokemon_id": 25,
        },
        {
            "email": "misty@poke.com",
            "user_id": "misty",
            "latitude": -19.5310,
            "longitude": -42.6102,
            "icon_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
            "companion_pokemon_id": 7,
        },
        {
            "email": "brock@poke.com",
            "user_id": "brock",
            "latitude": -19.5315,
            "longitude": -42.6108,
            "icon_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png",
            "companion_pokemon_id": 95,
        },
        {
            "email": "felipe@poke.com",
            "user_id": "felipe",
            "latitude": -19.5313,
            "longitude": -42.6104,
            "icon_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png",
            "companion_pokemon_id": 149,
        },
    ]

    users: dict[str, User] = {}

    for item in users_data:
        user = User(
            email=item["email"],
            hashed_password=get_password_hash("Senha123"),
            user_id=item["user_id"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            icon_url=item["icon_url"],
            companion_pokemon_id=item["companion_pokemon_id"],
            last_updated=now,
        )

        db.add(user)
        users[item["user_id"]] = user

    db.commit()

    for user in users.values():
        db.refresh(user)

    return users


def create_pokemon_entities(db) -> dict[str, PokemonEntity]:
    """
    Cria instâncias físicas de Pokemon no mapa.

    Alguns ficam disponíveis para adoção.
    Outros são usados como Pokemon já adotados na party.
    """
    now = datetime.utcnow()

    pokemon_data = [
        {
            "key": "pikachu_mapa",
            "pokemon_id": 25,
            "latitude": -19.53121,
            "longitude": -42.61051,
            "is_shiny": False,
            "gender": "male",
            "type_1": "Elétrico",
            "type_2": None,
        },
        {
            "key": "charmander_mapa",
            "pokemon_id": 4,
            "latitude": -19.53105,
            "longitude": -42.61025,
            "is_shiny": False,
            "gender": "male",
            "type_1": "Fogo",
            "type_2": None,
        },
        {
            "key": "squirtle_mapa",
            "pokemon_id": 7,
            "latitude": -19.53135,
            "longitude": -42.61045,
            "is_shiny": False,
            "gender": "female",
            "type_1": "Água",
            "type_2": None,
        },
        {
            "key": "bulbasaur_adocao",
            "pokemon_id": 1,
            "latitude": -19.53122,
            "longitude": -42.61055,
            "is_shiny": False,
            "gender": "male",
            "type_1": "Planta",
            "type_2": "Veneno",
        },
        {
            "key": "eevee_adocao",
            "pokemon_id": 133,
            "latitude": -19.53110,
            "longitude": -42.61020,
            "is_shiny": True,
            "gender": "female",
            "type_1": "Normal",
            "type_2": None,
        },
        {
            "key": "gastly_adocao",
            "pokemon_id": 92,
            "latitude": -19.53145,
            "longitude": -42.61075,
            "is_shiny": False,
            "gender": "genderless",
            "type_1": "Fantasma",
            "type_2": "Veneno",
        },
        {
            "key": "onix_party",
            "pokemon_id": 95,
            "latitude": -19.53150,
            "longitude": -42.61080,
            "is_shiny": False,
            "gender": "male",
            "type_1": "Pedra",
            "type_2": "Terra",
        },
        {
            "key": "dragonite_party",
            "pokemon_id": 149,
            "latitude": -19.53130,
            "longitude": -42.61040,
            "is_shiny": False,
            "gender": "female",
            "type_1": "Dragão",
            "type_2": "Voador",
        },
    ]

    entities: dict[str, PokemonEntity] = {}

    for item in pokemon_data:
        pokemon_id = item["pokemon_id"]

        entity = PokemonEntity(
            pokemon_id=pokemon_id,
            latitude=item["latitude"],
            longitude=item["longitude"],
            sprite_url=f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pokemon_id}.png",
            is_shiny=item["is_shiny"],
            gender=item["gender"],
            type_1=item["type_1"],
            type_2=item["type_2"],
            created_at=now,
            expires_at=now + timedelta(days=7),
            version_id=1,
        )

        db.add(entity)
        entities[item["key"]] = entity

    db.commit()

    for entity in entities.values():
        db.refresh(entity)

    return entities


def create_user_parties(db, users: dict[str, User], entities: dict[str, PokemonEntity]) -> None:
    """
    Adiciona alguns Pokemon já adotados na party dos usuários.
    """
    party_data = [
        {
            "owner": "brock",
            "entity_key": "onix_party",
        },
        {
            "owner": "felipe",
            "entity_key": "dragonite_party",
        },
    ]

    for item in party_data:
        user = users[item["owner"]]
        entity = entities[item["entity_key"]]

        user_pokemon = UserPokemon(
            user_id=user.id,
            pokemon_id=entity.pokemon_id,
            pokemon_entity_id=entity.id,
        )

        db.add(user_pokemon)

    db.commit()


def create_adoptions(db, entities: dict[str, PokemonEntity]) -> None:
    """
    Cria adoções disponíveis no Adoption Board.

    receiver_user_id fica None para indicar que ainda ninguém aceitou.
    status NEW é o status usado pelo endpoint de adoções disponíveis.
    """
    now = datetime.utcnow()

    adoptions_data = [
        {
            "entity_key": "bulbasaur_adocao",
            "provider_user_id": "ash",
        },
        {
            "entity_key": "eevee_adocao",
            "provider_user_id": "misty",
        },
        {
            "entity_key": "gastly_adocao",
            "provider_user_id": "brock",
        },
    ]

    for item in adoptions_data:
        entity = entities[item["entity_key"]]

        adoption = Adoption(
            pokemon_entity_id=entity.id,
            provider_user_id=item["provider_user_id"],
            receiver_user_id=None,
            status=AdoptionStatus.NEW,
            created_at=now,
            updated_at=now,
        )

        db.add(adoption)

    db.commit()


def main() -> None:
    """
    Executa o seed completo.
    """
    print("Criando tabelas, caso ainda não existam...")
    Base.metadata.create_all(bind=engine)

    print("Criando backup do banco atual...")
    backup_database_file()

    db = SessionLocal()

    try:
        print("Limpando tabelas...")
        reset_tables(db)

        print("Criando usuários...")
        users = create_users(db)

        print("Criando Pokemon no mapa...")
        entities = create_pokemon_entities(db)

        print("Criando parties...")
        create_user_parties(db, users, entities)

        print("Criando adoções disponíveis...")
        create_adoptions(db, entities)

        print("")
        print("Banco populado com sucesso.")
        print("")
        print("Usuários de teste:")
        print("ash@poke.com      / Senha123")
        print("misty@poke.com    / Senha123")
        print("brock@poke.com    / Senha123")
        print("felipe@poke.com   / Senha123")
        print("")
        print("Agora rode o backend e teste o app.")

    except Exception as error:
        db.rollback()
        print("Erro ao popular banco:")
        print(error)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()