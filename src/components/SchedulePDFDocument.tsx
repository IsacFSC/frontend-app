"use client";
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';
import { Schedule as ServiceSchedule } from '@/services/scheduleService';
import { formatSkill } from '@/lib/skills';

// Estilos para o documento PDF, inspirados no design do site
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#f3f4f6', // gray-100
    padding: 20,
  },
  container: {
    backgroundColor: '#fed7aa', // orange-200
    borderRadius: 8,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#1f2937', // gray-900
        marginBottom: 8,
      },
      description: {
        fontSize: 12,
        color: '#4b5563', // gray-700
      },
      dateTime: {
        fontSize: 11,
        color: '#52525b', // zinc-600
        marginBottom: 16,
      },
      section: {
        marginTop: 16,
      },
      sectionTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#1f2937', // gray-900
        marginBottom: 8,
      },
      userList: {
        paddingLeft: 10,
      },
      userListItem: {
        fontSize: 12,
        color: '#374151', // gray-800
        marginBottom: 4,
      },
      taskList: {
        paddingLeft: 10,
      },
      taskListItem: {
        marginBottom: 8,
      },
      taskName: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#1f2937',
      },
      taskDescription: {
        fontSize: 11,
        color: '#4b5563',
      },
      link: {
        color: '#2563eb', // blue-600
        textDecoration: 'underline',
      },
      footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#d1d5db', // gray-300
      },
      footerText: {
        fontSize: 10,
        color: '#4b5563', // gray-700
      },
    });
    
    // Using centralized skill formatter for consistent Portuguese labels
    
    // Função para transformar links em componentes <Link> no PDF
    const linkify = (text: string) => {
      if (!text) return null;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.split('\n').map((line, index) => (
        <Text key={index}>
          {line.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <Link key={i} src={part} style={styles.link}>
                  {part}
                </Link>
              );
            }
            return <Text key={i}>{part}</Text>;
          })}
        </Text>
      ));
    };
    
    interface SchedulePDFDocumentProps {
      schedule: ServiceSchedule;
    }
    
    const SchedulePDFDocument: React.FC<SchedulePDFDocumentProps> = ({ schedule }) => (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.container}>
            {/* Cabeçalho */}
            <View style={styles.header}>
              <Text style={styles.title}>{schedule.name}</Text>
              {schedule.description && (
                <Text style={styles.description}>{schedule.description}</Text>
              )}
            </View>
    
            {/* Data e Hora */}
            <Text style={styles.dateTime}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Início:</Text> {new Date(schedule.startTime).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - <Text style={{ fontFamily: 'Helvetica-Bold' }}>Fim:</Text> {new Date(schedule.endTime).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </Text>
    
            {/* Usuários */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Usuários na Escala:</Text>
              <View style={styles.userList}>
                {schedule.users?.map(userOnSchedule => (
                  <Text key={userOnSchedule.userId} style={styles.userListItem}>
                    - {userOnSchedule.user.name} - <Text style={{ fontStyle: 'italic' }}>{formatSkill(userOnSchedule.skill)}</Text>
                  </Text>
                ))}
              </View>
            </View>
    
            {/* Tarefas */}
            {schedule.tasks && schedule.tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tarefas na Escala:</Text>
                <View style={styles.taskList}>
                  {schedule.tasks.map(task => (
                    <View key={task.id} style={styles.taskListItem}>
                      <Text style={styles.taskName}>{task.name}</Text>
                      {task.description && (
                        <View style={styles.taskDescription}>
                          {linkify(task.description)}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
    
            {/* Rodapé com Observação */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>Obs:</Text> Executem as músicas com excelência, atenção para os horarios de ensaio que acontecem as 19:30h nas quintas feiras, poderão haver mudanças conforme orientações do líder. Chegar com antecedência nos cultos 30 minutos antes do início dos cultos, poderão haver mudanças conforme orientações do líder. Sê tu uma benção!
              </Text>
            </View>
          </View>
        </Page>
      </Document>
    );
    
    export default SchedulePDFDocument;
    