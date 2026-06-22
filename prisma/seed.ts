import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@colonie-tchad.ga' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@colonie-tchad.ga',
      password: adminPassword,
      role: 'admin',
    },
  })

  // Create viewer user
  const viewerPassword = await hash('viewer123', 12)
  await prisma.user.upsert({
    where: { email: 'lecteur@colonie-tchad.ga' },
    update: {},
    create: {
      name: 'Lecteur',
      email: 'lecteur@colonie-tchad.ga',
      password: viewerPassword,
      role: 'viewer',
    },
  })

  // Create bureau user
  const bureauPassword = await hash('bureau123', 12)
  await prisma.user.upsert({
    where: { email: 'bureau@colonie-tchad.ga' },
    update: {},
    create: {
      name: 'Membre Bureau',
      email: 'bureau@colonie-tchad.ga',
      password: bureauPassword,
      role: 'bureau',
    },
  })

  // Create sample citizens
  const sampleCitoyens = [
    {
      numeroCarte: 'CT-MM-001',
      nom: 'MAHAMAT',
      prenom: 'Abdoulaye',
      dateNaissance: '1985-03-15',
      lieuNaissance: "N'Djamena",
      sexe: 'M',
      nationalite: 'Tchadienne',
      telephone: '+241 77 12 34 56',
      ville: 'Moanda',
      quartier: 'Centre-ville',
      profession: 'Commerçant',
      estEmploye: true,
      situationFamiliale: 'Marié(e)',
      nombreEnfants: 3,
      familleAuGabon: true,
      carteSejour: 'Oui',
      carteSejourNumero: 'CS-2024-001',
      carteSejourExpiration: '2025-12-31',
      carteColonie: 'Ok',
      carteColonieNumero: 'CC-001',
      carteColonieMontant: 25000,
      situationRegularite: 'Régulier',
      passeport: 'Oui',
      passeportNumero: 'TD-1234567',
      passeportExpiration: '2028-06-30',
    },
    {
      numeroCarte: 'CT-MM-002',
      nom: 'HASSAN',
      prenom: 'Fatima',
      dateNaissance: '1992-07-22',
      lieuNaissance: 'Moundou',
      sexe: 'F',
      nationalite: 'Tchadienne',
      telephone: '+241 66 98 76 54',
      ville: 'Mounana',
      quartier: 'Quartier administratif',
      profession: 'Coiffeuse',
      estEmploye: true,
      situationFamiliale: 'Célibataire',
      nombreEnfants: 1,
      familleAuGabon: false,
      carteSejour: 'Non',
      carteColonie: 'Encours',
      carteColonieMontant: 15000,
      situationRegularite: 'En cours',
      passeport: 'Oui',
      passeportNumero: 'TD-7654321',
      passeportExpiration: '2027-03-15',
    },
    {
      numeroCarte: 'CT-MM-003',
      nom: 'ABAKAR',
      prenom: 'Moussa',
      dateNaissance: '1978-11-05',
      lieuNaissance: 'Abéché',
      sexe: 'M',
      nationalite: 'Tchadienne',
      telephone: '+241 74 55 66 77',
      ville: 'Moanda',
      quartier: 'Marché',
      profession: 'Mécanicien',
      estEmploye: false,
      situationFamiliale: 'Marié(e)',
      nombreEnfants: 5,
      familleAuGabon: true,
      carteSejour: 'Non',
      carteColonie: 'Non',
      situationRegularite: 'Irrégulier',
      passeport: 'Non',
    },
    {
      numeroCarte: 'CT-MM-004',
      nom: 'DJIBRINE',
      prenom: 'Amina',
      dateNaissance: '1990-01-30',
      lieuNaissance: 'Sarh',
      sexe: 'F',
      nationalite: 'Tchadienne',
      telephone: '+241 62 33 44 55',
      ville: 'Mounana',
      profession: 'Vendeuse',
      estEmploye: true,
      situationFamiliale: 'Marié(e)',
      nombreEnfants: 2,
      familleAuGabon: true,
      carteSejour: 'Oui',
      carteSejourNumero: 'CS-2024-004',
      carteSejourExpiration: '2026-06-30',
      carteColonie: 'Ok',
      carteColonieNumero: 'CC-004',
      carteColonieMontant: 25000,
      situationRegularite: 'Régulier',
      passeport: 'Oui',
      passeportNumero: 'TD-9876543',
      passeportExpiration: '2029-01-15',
    },
    {
      numeroCarte: 'CT-MM-005',
      nom: 'OUMAR',
      prenom: 'Ibrahim',
      dateNaissance: '1995-08-12',
      lieuNaissance: "N'Djamena",
      sexe: 'M',
      nationalite: 'Tchadienne',
      telephone: '+241 77 88 99 00',
      ville: 'Moanda',
      quartier: 'Zone industrielle',
      profession: 'Soudeur',
      estEmploye: true,
      employeur: 'COMILOG',
      situationFamiliale: 'Célibataire',
      nombreEnfants: 0,
      familleAuGabon: false,
      carteSejour: 'Oui',
      carteSejourNumero: 'CS-2024-005',
      carteSejourExpiration: '2026-12-31',
      carteColonie: 'Encours',
      carteColonieMontant: 10000,
      situationRegularite: 'Régulier',
      passeport: 'Oui',
      passeportNumero: 'TD-1122334',
      passeportExpiration: '2027-09-20',
    },
  ]

  for (const citoyen of sampleCitoyens) {
    await prisma.citoyen.create({ data: citoyen })
  }

  console.log('Base de données initialisée avec succès !')
  console.log('Comptes créés :')
  console.log('  Admin  : admin@colonie-tchad.ga / admin123')
  console.log('  Bureau : bureau@colonie-tchad.ga / bureau123')
  console.log('  Lecteur: lecteur@colonie-tchad.ga / viewer123')
  console.log(`  ${sampleCitoyens.length} citoyens de test ajoutés`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
