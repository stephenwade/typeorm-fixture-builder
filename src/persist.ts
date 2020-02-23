/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityManager } from 'typeorm';
import { isPersisted, setPersisted } from './reflect';
import { resolve } from './resolve';

/**
 * Persists an array relation (many-to-many, one-to-many)
 *
 * @param manager EntityManager.
 * @param fixture Fixture.
 * @param propertyName Property.
 */
async function persistManyRelation(
  manager: EntityManager,
  fixture: any,
  propertyName: string,
): Promise<void> {
  for (const index in fixture[propertyName] || []) {
    fixture[propertyName][index] = await persist(
      manager,
      fixture[propertyName][index],
    );
  }
}

/**
 * Persists a non array relation (one-to-one, many-to-one).
 *
 * @param manager EntityManager.
 * @param fixture Fixture.
 * @param propertyName Property.
 */
async function persistOneRelation(
  manager: EntityManager,
  fixture: any,
  propertyName: string,
): Promise<void> {
  if (fixture[propertyName]) {
    fixture[propertyName] = await persist(manager, fixture[propertyName]);
  }
}

/**
 * Persists the relations of a fixture.
 *
 * @param manager EntityManager.
 * @param fixture Fixture.
 */
async function persistRelations(
  manager: EntityManager,
  fixture: any,
): Promise<void> {
  const { relations } = manager.connection.getMetadata(fixture.constructor);

  for (const { propertyName, relationType } of relations) {
    switch (relationType) {
      case 'many-to-many':
      case 'one-to-many':
        await persistManyRelation(manager, fixture, propertyName);
        break;

      case 'many-to-one':
      case 'one-to-one':
        await persistOneRelation(manager, fixture, propertyName);
        break;
    }
  }
}

/**
 * Persists the fixture itself.
 *
 * @param manager EntityManager.
 * @param fixture Fixture.
 */
async function persistEntity(
  manager: EntityManager,
  fixture: any,
): Promise<void> {
  return manager
    .getRepository(fixture.constructor)
    .save(await resolve(manager, fixture));
}

/**
 * Persists a fixture.
 *
 * @param manager EntityManager.
 * @param fixture Fixture.
 */
export async function persist(
  manager: EntityManager,
  fixture: any,
): Promise<any> {
  if (isPersisted(fixture) === false) {
    await persistRelations(manager, fixture);
    await persistEntity(manager, fixture);

    setPersisted(fixture, true);
  }

  return fixture;
}
